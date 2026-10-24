import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv
from pydantic import BaseModel, Field

load_dotenv()

class Settings(BaseModel):
    """Application configuration settings for curiousBuddy backend."""

    # Application Info
    APP_NAME: str = "curiousBuddy"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = Field(
        default_factory=lambda: os.getenv("DEBUG", "false").lower() in ("true", "1", "yes")
    )

    # CORS Allowed Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # ElevenLabs Conversational AI & TTS Configuration
    ELEVENLABS_API_KEY: str = Field(
        default_factory=lambda: os.getenv("ELEVENLABS_API_KEY", "")
    )
    ELEVENLABS_AGENT_ID: str = Field(
        default_factory=lambda: os.getenv("ELEVENLABS_AGENT_ID", "")
    )
    ELEVENLABS_VOICE_ID: str = Field(
        default_factory=lambda: os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")
    )
    ELEVENLABS_MODEL_ID: str = Field(
        default_factory=lambda: os.getenv("ELEVENLABS_MODEL_ID", "eleven_flash_v2_5")
    )

    @property
    def has_elevenlabs_key(self) -> bool:
        """Returns True if a valid ElevenLabs API key is configured."""
        return bool(self.ELEVENLABS_API_KEY and self.ELEVENLABS_API_KEY.strip())

    @property
    def has_elevenlabs_agent(self) -> bool:
        """Returns True if an ElevenLabs Conversational Agent ID is configured."""
        return bool(self.ELEVENLABS_AGENT_ID and self.ELEVENLABS_AGENT_ID.strip())


settings = Settings()
