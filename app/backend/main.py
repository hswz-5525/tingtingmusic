from fastapi import FastAPI, Depends, HTTPException, Request, BackgroundTasks
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
import os
from . import crud, models, schemas
from .config import settings
from .music_scanner import scan_music_directory

# Create database engine and session
engine = create_engine(
    settings.database_url, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create all tables
models.Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(title="听听音乐 API", description="一个简单的NAS音乐播放器API")

# Mount static files and templates
app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")

# Startup event - scan music directory and create default playlists
@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        # Create default playlists
        from . import crud
        crud.create_default_playlists(db)
        
        # Create "全部音乐" playlist if it doesn't exist
        all_music_playlist = db.query(models.Playlist).filter(
            models.Playlist.name == "全部音乐"
        ).first()
        if not all_music_playlist:
            all_music_playlist = models.Playlist(
                name="全部音乐",
                type="all",
                music_dir=settings.music_dir
            )
            db.add(all_music_playlist)
            db.commit()
        
        # Scan music directory in background
        scan_music_directory(db, settings.music_dir)
    finally:
        db.close()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Root endpoint - serve the main HTML page
@app.get("/")
def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# Settings page endpoint
@app.get("/settings")
def read_settings(request: Request):
    return templates.TemplateResponse("settings.html", {"request": request, "current_folder": settings.music_dir, "current_lyric_folder": None})

# API endpoints
@app.post("/api/scan")
def scan_music(background_tasks: BackgroundTasks, db: Session = Depends(get_db), music_dir: str = None):
    # 如果提供了新的音乐目录，使用新目录，否则使用配置中的目录
    scan_dir = music_dir if music_dir else settings.music_dir
    background_tasks.add_task(scan_music_directory, db, scan_dir)
    return {"message": "Music scan started"}

@app.get("/api/tracks", response_model=list[schemas.TrackWithDetails])
def read_tracks(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    tracks = crud.get_tracks_with_details(db, skip=skip, limit=limit)
    return tracks

@app.get("/api/tracks/{track_id}", response_model=schemas.TrackWithDetails)
def read_track(track_id: int, db: Session = Depends(get_db)):
    db_track = crud.get_track(db, track_id=track_id)
    if db_track is None:
        raise HTTPException(status_code=404, detail="Track not found")
    return db_track

@app.get("/api/tracks/{track_id}/stream")
def stream_track(track_id: int, db: Session = Depends(get_db)):
    db_track = crud.get_track(db, track_id=track_id)
    if db_track is None:
        raise HTTPException(status_code=404, detail="Track not found")
    
    if not os.path.exists(db_track.file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    def iterfile():
        with open(db_track.file_path, "rb") as f:
            while chunk := f.read(1024 * 1024):  # 1MB chunks
                yield chunk
    
    # Get MIME type based on file extension
    mime_types = {
        ".mp3": "audio/mpeg",
        ".flac": "audio/flac",
        ".wav": "audio/wav",
        ".aac": "audio/aac",
        ".ogg": "audio/ogg",
        ".alac": "audio/alac",
        ".aiff": "audio/aiff",
        ".ape": "audio/ape"
    }
    
    ext = os.path.splitext(db_track.file_path)[1].lower()
    mime_type = mime_types.get(ext, "audio/mpeg")
    
    return StreamingResponse(iterfile(), media_type=mime_type)

@app.get("/api/artists", response_model=list[schemas.Artist])
def read_artists(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    artists = crud.get_artists(db, skip=skip, limit=limit)
    return artists

@app.get("/api/albums", response_model=list[schemas.Album])
def read_albums(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    albums = crud.get_albums(db, skip=skip, limit=limit)
    return albums

# Playlist endpoints
@app.get("/api/playlists", response_model=list[schemas.Playlist])
def read_playlists(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    playlists = crud.get_playlists(db, skip=skip, limit=limit)
    return playlists

@app.get("/api/playlists/{playlist_id}", response_model=schemas.PlaylistWithTracks)
def read_playlist(playlist_id: int, db: Session = Depends(get_db)):
    playlist = crud.get_playlist_with_tracks(db, playlist_id=playlist_id)
    if playlist is None:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return playlist

@app.post("/api/playlists", response_model=schemas.Playlist)
def create_playlist(playlist: schemas.PlaylistCreate, db: Session = Depends(get_db)):
    import os
    from .config import settings
    
    # 设置播放列表类型为custom
    playlist.type = "custom"
    
    # 在musics文件夹下创建对应名称的文件夹
    playlist_dir = os.path.join(settings.music_dir, playlist.name)
    if not os.path.exists(playlist_dir):
        os.makedirs(playlist_dir)
    
    # 设置播放列表的music_dir为创建的文件夹路径
    playlist.music_dir = playlist_dir
    
    return crud.create_playlist(db=db, playlist=playlist)

@app.put("/api/playlists/{playlist_id}", response_model=schemas.Playlist)
def update_playlist(playlist_id: int, playlist: schemas.PlaylistCreate, db: Session = Depends(get_db)):
    db_playlist = crud.update_playlist(db=db, playlist_id=playlist_id, playlist=playlist)
    if db_playlist is None:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return db_playlist

@app.delete("/api/playlists/{playlist_id}")
def delete_playlist(playlist_id: int, db: Session = Depends(get_db)):
    if not crud.delete_playlist(db=db, playlist_id=playlist_id):
        raise HTTPException(status_code=404, detail="Playlist not found")
    return {"message": "Playlist deleted"}

@app.post("/api/playlists/{playlist_id}/tracks", response_model=schemas.PlaylistTrack)
def add_track_to_playlist(playlist_id: int, track_id: int, order: int = 0, db: Session = Depends(get_db)):
    playlist_track = schemas.PlaylistTrackCreate(
        playlist_id=playlist_id,
        track_id=track_id,
        order=order
    )
    return crud.add_track_to_playlist(db=db, playlist_track=playlist_track)

@app.delete("/api/playlists/{playlist_id}/tracks/{track_id}")
def remove_track_from_playlist(playlist_id: int, track_id: int, db: Session = Depends(get_db)):
    if not crud.remove_track_from_playlist(db=db, playlist_id=playlist_id, track_id=track_id):
        raise HTTPException(status_code=404, detail="Track not found in playlist")
    return {"message": "Track removed from playlist"}

# Lyric endpoints
@app.get("/api/tracks/{track_id}/lyric", response_model=schemas.Lyric)
def read_lyric(track_id: int, db: Session = Depends(get_db)):
    lyric = crud.get_lyric(db, track_id=track_id)
    if lyric is None:
        raise HTTPException(status_code=404, detail="Lyric not found")
    return lyric

@app.post("/api/tracks/{track_id}/lyric", response_model=schemas.Lyric)
def create_lyric(track_id: int, content: str, db: Session = Depends(get_db)):
    lyric = schemas.LyricCreate(track_id=track_id, content=content)
    return crud.create_lyric(db=db, lyric=lyric)

@app.get("/api/tracks/{track_id}/cover")
def get_track_cover(track_id: int, db: Session = Depends(get_db)):
    track = crud.get_track(db, track_id=track_id)
    if track is None:
        raise HTTPException(status_code=404, detail="Track not found")
    
    # 检查歌曲是否有专辑封面
    if track.album and track.album.cover_path and os.path.exists(track.album.cover_path):
        return FileResponse(track.album.cover_path)
    else:
        # 返回默认封面
        return FileResponse("app/static/default-cover.png")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.host, port=settings.port)
