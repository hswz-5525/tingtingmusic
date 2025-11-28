from pydantic import BaseModel
from typing import Optional, List

class TrackBase(BaseModel):
    title: str
    artist_id: Optional[int] = None
    album_id: Optional[int] = None
    file_path: str
    file_type: str
    duration: float
    bitrate: Optional[int] = None
    sample_rate: Optional[int] = None

class TrackCreate(TrackBase):
    pass

class Track(TrackBase):
    id: int
    
    class Config:
        from_attributes = True

class ArtistBase(BaseModel):
    name: str

class ArtistCreate(ArtistBase):
    pass

class Artist(ArtistBase):
    id: int
    
    class Config:
        from_attributes = True

class AlbumBase(BaseModel):
    title: str
    artist_id: Optional[int] = None
    cover_path: Optional[str] = None

class AlbumCreate(AlbumBase):
    pass

class Album(AlbumBase):
    id: int
    
    class Config:
        from_attributes = True

class TrackWithDetails(Track):
    artist: Optional[Artist] = None
    album: Optional[Album] = None
    lyric: Optional["Lyric"] = None

class LyricBase(BaseModel):
    content: str

class LyricCreate(LyricBase):
    track_id: int

class Lyric(LyricBase):
    id: int
    track_id: int
    
    class Config:
        from_attributes = True

class PlaylistBase(BaseModel):
    name: str
    type: str = "custom"

class PlaylistCreate(PlaylistBase):
    pass

class Playlist(PlaylistBase):
    id: int
    
    class Config:
        from_attributes = True

class PlaylistWithTracks(Playlist):
    tracks: List[Track] = []

class PlaylistTrackBase(BaseModel):
    playlist_id: int
    track_id: int
    order: int

class PlaylistTrackCreate(PlaylistTrackBase):
    pass

class PlaylistTrack(PlaylistTrackBase):
    id: int
    
    class Config:
        from_attributes = True
