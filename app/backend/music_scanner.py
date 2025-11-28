import os
from mutagen import File
from sqlalchemy.orm import Session
from . import models, schemas, crud

# Supported audio file extensions
SUPPORTED_EXTENSIONS = [
    '.mp3', '.flac', '.wav', '.aac', '.ogg', '.alac', '.aiff'
]

# Supported lyric file extensions
LYRIC_EXTENSIONS = ['.lrc']

def scan_music_directory(db: Session, music_dir: str):
    """Scan music directory and add tracks to database"""
    print(f"Scanning music directory: {music_dir}")
    
    # First process all audio files to create track entries
    audio_files = []
    lyric_files = []
    
    for root, dirs, files in os.walk(music_dir):
        for file in files:
            file_path = os.path.join(root, file)
            ext = os.path.splitext(file)[1].lower()
            
            if ext in SUPPORTED_EXTENSIONS:
                process_audio_file(db, file_path, ext)
                audio_files.append(file_path)
            elif ext in LYRIC_EXTENSIONS:
                lyric_files.append(file_path)
    
    # Then process all lyric files and associate with tracks
    for lyric_file in lyric_files:
        process_lyric_file(db, lyric_file)
    
    print("Scan completed")

def process_audio_file(db: Session, file_path: str, ext: str):
    """Process a single audio file and add to database"""
    # Check if track already exists
    existing_track = crud.get_track_by_path(db, file_path)
    if existing_track:
        return
    
    try:
        # Use mutagen to read metadata
        audio = File(file_path)
        if not audio:
            return
        
        # Extract metadata
        metadata = extract_metadata(audio, file_path, ext)
        
        # Create or get artist
        artist_id = None
        if metadata['artist']:
            artist = crud.get_artist_by_name(db, metadata['artist'])
            if not artist:
                artist = crud.create_artist(db, schemas.ArtistCreate(name=metadata['artist']))
            artist_id = artist.id
        
        # Create or get album
        album_id = None
        if metadata['album']:
            # For simplicity, we're not checking for existing albums with same name and artist
            # This could be improved later
            album = schemas.AlbumCreate(
                title=metadata['album'],
                artist_id=artist_id
            )
            album = crud.create_album(db, album)
            album_id = album.id
        
        # Create track
        track = schemas.TrackCreate(
            title=metadata['title'],
            artist_id=artist_id,
            album_id=album_id,
            file_path=file_path,
            file_type=ext[1:],  # Remove leading dot
            duration=metadata['duration'],
            bitrate=metadata['bitrate'],
            sample_rate=metadata['sample_rate']
        )
        
        crud.create_track(db, track)
        print(f"Added track: {metadata['title']} by {metadata['artist']}")
        
    except Exception as e:
        print(f"Error processing file {file_path}: {e}")

def extract_metadata(audio, file_path: str, ext: str) -> dict:
    """Extract metadata from audio file"""
    metadata = {
        'title': os.path.basename(file_path).replace(ext, ''),
        'artist': '',
        'album': '',
        'duration': 0.0,
        'bitrate': None,
        'sample_rate': None
    }
    
    # Get duration
    try:
        metadata['duration'] = audio.info.length
    except:
        pass
    
    # Get bitrate
    try:
        metadata['bitrate'] = audio.info.bitrate
    except:
        pass
    
    # Get sample rate
    try:
        metadata['sample_rate'] = audio.info.sample_rate
    except:
        pass
    
    # Extract tags based on file type
    if ext == '.mp3':
        # ID3 tags
        if hasattr(audio, 'tags') and audio.tags:
            # Try different tag formats
            for tag in ['TIT2', 'TITLE']:
                if tag in audio.tags:
                    metadata['title'] = audio.tags[tag].text[0]
                    break
            
            for tag in ['TPE1', 'ARTIST']:
                if tag in audio.tags:
                    metadata['artist'] = audio.tags[tag].text[0]
                    break
            
            for tag in ['TALB', 'ALBUM']:
                if tag in audio.tags:
                    metadata['album'] = audio.tags[tag].text[0]
                    break
    
    elif ext in ['.flac', '.ogg']:
        # Vorbis comments
        if hasattr(audio, 'tags') and audio.tags:
            metadata['title'] = audio.tags.get('title', [metadata['title']])[0]
            metadata['artist'] = audio.tags.get('artist', [''])[0]
            metadata['album'] = audio.tags.get('album', [''])[0]
    
    elif ext in ['.wav', '.aiff']:
        # WAV/AIFF may not have metadata, use filename
        pass
    
    elif ext in ['.aac', '.alac']:
        # M4A/ALAC tags
        if hasattr(audio, 'tags') and audio.tags:
            for tag in ['\xa9nam', 'title']:
                if tag in audio.tags:
                    metadata['title'] = audio.tags[tag]
                    break
            
            for tag in ['\xa9ART', 'artist']:
                if tag in audio.tags:
                    metadata['artist'] = audio.tags[tag]
                    break
            
            for tag in ['\xa9alb', 'album']:
                if tag in audio.tags:
                    metadata['album'] = audio.tags[tag]
                    break
    
    return metadata

def process_lyric_file(db: Session, lyric_path: str):
    """Process a lyric file and associate with corresponding track"""
    try:
        # Read lyric content
        with open(lyric_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Get base filename without extension
        base_name = os.path.splitext(os.path.basename(lyric_path))[0]
        lyric_dir = os.path.dirname(lyric_path)
        
        # Find corresponding audio file
        audio_file = None
        for ext in SUPPORTED_EXTENSIONS:
            potential_audio_path = os.path.join(lyric_dir, base_name + ext)
            if os.path.exists(potential_audio_path):
                audio_file = potential_audio_path
                break
        
        if not audio_file:
            # Try to find audio file with similar name
            for root, dirs, files in os.walk(lyric_dir):
                for file in files:
                    if os.path.splitext(file)[0] == base_name and os.path.splitext(file)[1].lower() in SUPPORTED_EXTENSIONS:
                        audio_file = os.path.join(root, file)
                        break
                if audio_file:
                    break
        
        if not audio_file:
            return
        
        # Get track from database
        track = crud.get_track_by_path(db, audio_file)
        if not track:
            return
        
        # Create or update lyric
        lyric = schemas.LyricCreate(
            track_id=track.id,
            content=content
        )
        crud.create_lyric(db, lyric)
        print(f"Added lyric for track: {track.title}")
        
    except Exception as e:
        print(f"Error processing lyric file {lyric_path}: {e}")
