from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    music_dir: str = "./musics"
    host: str = "0.0.0.0"
    port: int = 18003
    database_url: str = "sqlite:///./music.db"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
