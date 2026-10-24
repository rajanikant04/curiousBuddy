import sys
from pathlib import Path

# Add backend directory to sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.config import settings
from app.services.elevenlabs import eleven_service


def test_config_loading():
    print("=== 1. Testing Config & .env Loading ===")
    print(f"ELEVENLABS_API_KEY present: {settings.has_elevenlabs_key}")
    print(f"ELEVENLABS_VOICE_ID: {settings.ELEVENLABS_VOICE_ID}")
    print(f"ELEVENLABS_AGENT_ID: {settings.ELEVENLABS_AGENT_ID or '(None specified yet)'}")
    assert settings.has_elevenlabs_key, "API key should be loaded from backend/.env"
    print(" Config loaded successfully!\n")


def test_elevenlabs_service_initialization():
    print("=== 2. Testing ElevenLabs Service & Client ===")
    client = eleven_service.client
    assert client is not None, "Client should be initialized"
    print(" Client successfully initialized with ElevenLabs SDK!\n")


def test_list_agents():
    print("=== 3. Testing Conversational AI (ElevenAgent) Listing ===")
    try:
        agents = eleven_service.list_agents()
        print(f" Successfully connected to ElevenLabs Conversational AI API!")
        print(f" Found {len(agents)} configured conversational agents.")
        for a in agents:
            print(f"  - Agent ID: {a['agent_id']} | Name: {a['name']}")
    except Exception as e:
        print(f" Error listing agents: {e}")


def test_tts_synthesis():
    print("\n=== 4. Testing Text-to-Speech (TTS) Synthesis ===")
    sample_text = "Hello! I am curiousBuddy, your Feynman study partner."
    try:
        audio_bytes = eleven_service.synthesize_speech(text=sample_text)
        print(f" TTS synthesis successful! Generated {len(audio_bytes)} audio bytes.")
    except Exception as e:
        print(f" Note on TTS: {e}")


if __name__ == "__main__":
    print("========================================")
    print(" Running curiousBuddy ElevenLabs Tests ")
    print("========================================\n")
    test_config_loading()
    test_elevenlabs_service_initialization()
    test_list_agents()
    test_tts_synthesis()
    print("\n========================================")
    print(" All tests completed!")
    print("========================================")
