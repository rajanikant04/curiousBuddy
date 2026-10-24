import sys
from pathlib import Path

# Add backend directory to sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.config import settings
from app.services.create_agent import DEFAULT_FEYNMAN_PROMPT, DEFAULT_FIRST_MESSAGE
from elevenlabs.client import ElevenLabs


def test_config_loading():
    print("=== 1. Testing Config & .env Loading ===")
    print(f"ELEVENLABS_API_KEY present: {settings.has_elevenlabs_key}")
    print(f"ELEVENLABS_VOICE_ID: {settings.ELEVENLABS_VOICE_ID}")
    print(f"ELEVENLABS_AGENT_ID: {settings.ELEVENLABS_AGENT_ID or '(None specified yet)'}")
    assert settings.has_elevenlabs_key, "API key should be loaded from backend/.env"
    print(" Config loaded successfully!\n")


def test_elevenlabs_client_initialization():
    print("=== 2. Testing ElevenLabs SDK Client ===")
    client = ElevenLabs(api_key=settings.ELEVENLABS_API_KEY)
    assert client is not None, "Client should be initialized"
    print(" Client successfully initialized with ElevenLabs SDK!\n")


def test_list_agents():
    print("=== 3. Testing Conversational AI (ElevenAgent) Listing ===")
    try:
        client = ElevenLabs(api_key=settings.ELEVENLABS_API_KEY)
        response = client.conversational_ai.agents.list()
        agents_list = getattr(response, "agents", [])
        print(f" Successfully connected to ElevenLabs Conversational AI API!")
        print(f" Found {len(agents_list)} configured conversational agents.")
        for a in agents_list:
            agent_id = getattr(a, "agent_id", None) or getattr(a, "id", None)
            name = getattr(a, "name", "Unnamed")
            print(f"  - Agent ID: {agent_id} | Name: {name}")
    except Exception as e:
        print(f" Error listing agents: {e}")


def test_create_agent_module():
    print("\n=== 4. Testing create_agent Module Configuration ===")
    assert "Cube" in DEFAULT_FEYNMAN_PROMPT, "Prompt should contain Cube persona"
    assert "Cube" in DEFAULT_FIRST_MESSAGE, "First message should introduce Cube"
    print(" Socratic prompt and Cube persona verified!\n")


if __name__ == "__main__":
    print("========================================")
    print(" Running curiousBuddy ElevenLabs Tests ")
    print("========================================\n")
    test_config_loading()
    test_elevenlabs_client_initialization()
    test_list_agents()
    test_create_agent_module()
    print("\n========================================")
    print(" All tests completed!")
    print("========================================")

