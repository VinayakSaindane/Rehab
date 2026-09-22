import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "RehabSense API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "rehabsense-hackathon-super-secret-key-2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days for easy demoing
    
    # Database
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "rehabsense")
    FORCE_IN_MEMORY_DB: bool = os.getenv("FORCE_IN_MEMORY_DB", "false").lower() == "true"

settings = Settings()
