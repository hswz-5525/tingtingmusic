from sqlalchemy.orm import Session
from . import models, schemas

# Artist operations
def get_artist(db: Session, artist_id: int):
    return db.query(models.Artist).filter(models.Artist.id == artist_id).first()

def get_artist_by_name(db: Session, name: str):
    return db.query(models.Artist).filter(models.Artist.name == name).first()

def get_artists(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Artist).offset(skip).limit(limit).all()

def create_artist(db: Session, artist: schemas.ArtistCreate):
    db_artist = models.Artist(name=artist.name)
    db.add(db_artist)
    db.commit()
    db.refresh(db_artist)
    return db_artist

# Album operations
def get_album(db: Session, album_id: int):
    return db.query(models.Album).filter(models.Album.id == album_id).first()

def get_albums(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Album).offset(skip).limit(limit).all()

def create_album(db: Session, album: schemas.AlbumCreate):
    db_album = models.Album(**album.dict())
    db.add(db_album)
    db.commit()
    db.refresh(db_album)
    return db_album

# Track operations
def get_track(db: Session, track_id: int):
    return db.query(models.Track).filter(models.Track.id == track_id).first()

def get_track_by_path(db: Session, file_path: str):
    return db.query(models.Track).filter(models.Track.file_path == file_path).first()

def get_tracks(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Track).offset(skip).limit(limit).all()

def get_tracks_with_details(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Track).offset(skip).limit(limit).all()

def create_track(db: Session, track: schemas.TrackCreate):
    db_track = models.Track(**track.dict())
    db.add(db_track)
    db.commit()
    db.refresh(db_track)
    return db_track

def delete_track(db: Session, track_id: int):
    db_track = get_track(db, track_id)
    if db_track:
        db.delete(db_track)
        db.commit()
        return True
    return False

# Playlist operations
def get_playlist(db: Session, playlist_id: int):
    return db.query(models.Playlist).filter(models.Playlist.id == playlist_id).first()

def get_playlists(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Playlist).offset(skip).limit(limit).all()

def get_playlist_with_tracks(db: Session, playlist_id: int):
    playlist = db.query(models.Playlist).filter(models.Playlist.id == playlist_id).first()
    if playlist:
        # Load tracks with proper ordering
        playlist.tracks.sort(key=lambda pt: pt.order)
    return playlist

def create_playlist(db: Session, playlist: schemas.PlaylistCreate):
    db_playlist = models.Playlist(name=playlist.name, type=playlist.type)
    db.add(db_playlist)
    db.commit()
    db.refresh(db_playlist)
    return db_playlist

def create_default_playlists(db: Session):
    """Create default playlists if they don't exist"""
    default_playlists = [
        {"name": "我的收藏", "type": "favorite"},
        {"name": "最近播放", "type": "recent"}
    ]
    
    for pl in default_playlists:
        existing = db.query(models.Playlist).filter(
            models.Playlist.name == pl["name"],
            models.Playlist.type == pl["type"]
        ).first()
        if not existing:
            playlist = schemas.PlaylistCreate(**pl)
            create_playlist(db, playlist)

def update_playlist(db: Session, playlist_id: int, playlist: schemas.PlaylistCreate):
    db_playlist = get_playlist(db, playlist_id)
    if db_playlist:
        db_playlist.name = playlist.name
        db.commit()
        db.refresh(db_playlist)
    return db_playlist

def delete_playlist(db: Session, playlist_id: int):
    db_playlist = get_playlist(db, playlist_id)
    if db_playlist:
        db.delete(db_playlist)
        db.commit()
        return True
    return False

# PlaylistTrack operations
def add_track_to_playlist(db: Session, playlist_track: schemas.PlaylistTrackCreate):
    db_playlist_track = models.PlaylistTrack(**playlist_track.dict())
    db.add(db_playlist_track)
    db.commit()
    db.refresh(db_playlist_track)
    return db_playlist_track

def remove_track_from_playlist(db: Session, playlist_id: int, track_id: int):
    db_playlist_track = db.query(models.PlaylistTrack).filter(
        models.PlaylistTrack.playlist_id == playlist_id,
        models.PlaylistTrack.track_id == track_id
    ).first()
    if db_playlist_track:
        db.delete(db_playlist_track)
        db.commit()
        return True
    return False

# Lyric operations
def get_lyric(db: Session, track_id: int):
    return db.query(models.Lyric).filter(models.Lyric.track_id == track_id).first()

def create_lyric(db: Session, lyric: schemas.LyricCreate):
    # Check if lyric already exists
    existing_lyric = get_lyric(db, lyric.track_id)
    if existing_lyric:
        existing_lyric.content = lyric.content
        db.commit()
        db.refresh(existing_lyric)
        return existing_lyric
    
    db_lyric = models.Lyric(**lyric.dict())
    db.add(db_lyric)
    db.commit()
    db.refresh(db_lyric)
    return db_lyric

def delete_lyric(db: Session, track_id: int):
    db_lyric = get_lyric(db, track_id)
    if db_lyric:
        db.delete(db_lyric)
        db.commit()
        return True
    return False
