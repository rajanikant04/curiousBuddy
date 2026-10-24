import sys
from pathlib import Path
from typing import Optional

# Ensure backend root is in sys.path when run directly
BACKEND_DIR = Path(__file__).resolve().parents[2]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.config import settings

try:
    from elevenlabs.client import ElevenLabs
    HAS_ELEVENLABS = True
except ImportError:
    HAS_ELEVENLABS = False


# Default Socratic Feynman Prompt for Cube
DEFAULT_FEYNMAN_PROMPT = """
# Personality
Your name is Cube. You are a curious study buddy, an enthusiastic, highly curious, and slightly skeptical study companion.

# Goal
Practice the Feynman Technique with the student.
When they explain what they just studied:
1. Identify any jargon or buzzwords they used and ask them to explain what that actually means in plain, everyday language.
2. Ask probing 'why' and 'how' follow-up questions to test deep mechanical understanding.
3. Challenge them with simple real-world thought experiments and edge cases.
4. Keep your responses conversational, friendly, and concise (2-3 sentences max).

# Tone
Speak in a friendly, conversational manner
"""

DEFAULT_FIRST_MESSAGE = (
    "Hey there! Great focus session. I'm Cube, your curious study buddy. "
    "What's the core concept you just studied? Explain it to me as if I'm 12 years old!"
)


def create_feynman_agent(
    agent_name: str = "curiousBuddy Feynman Debriefer (Cube)",
    voice_id: Optional[str] = None,
    prompt: str = DEFAULT_FEYNMAN_PROMPT,
    first_message: str = DEFAULT_FIRST_MESSAGE,
) -> str:
    """
    Creates a new ElevenLabs Conversational AI Agent for curiousBuddy using the official API.
    
    All credentials and defaults come directly from app.config.settings.
    Follows: https://elevenlabs.io/docs/eleven-agents/quickstart
    
    :return: The generated agent_id string.
    """
    if not HAS_ELEVENLABS:
        raise RuntimeError("ElevenLabs SDK is not installed. Run `pip install elevenlabs`.")

    if not settings.has_elevenlabs_key:
        raise ValueError("ELEVENLABS_API_KEY is not configured in config.py.")

    client = ElevenLabs(api_key=settings.ELEVENLABS_API_KEY)
    target_voice = voice_id or settings.ELEVENLABS_VOICE_ID

    print(f" Provisioning ElevenLabs agent: '{agent_name}'...")
    response = client.conversational_ai.agents.create(
        name=agent_name,
        tags=["curiousBuddy", "feynman", "education", "studyBuddy"],
        conversation_config={
            "tts": {
                "voice_id": target_voice,
                "model_id": "eleven_flash_v2",
            },
            "agent": {
                "first_message": first_message,
                "prompt": {
                    "prompt": prompt,
                },
            },
        },
    )

    agent_id = getattr(response, "agent_id", None) or getattr(response, "id", None)
    if not agent_id:
        raise RuntimeError(f"Unexpected response from ElevenLabs API: {response}")

    print(f" Agent created successfully!")
    print(f"   Name     : {agent_name}")
    print(f"   Agent ID : {agent_id}")
    print(f"   Voice ID : {target_voice}")

    return agent_id


if __name__ == "__main__":
    print("==================================================")
    print(" curiousBuddy — ElevenLabs Agent Provisioning Tool ")
    print("==================================================\n")
    try:
        agent_id = create_feynman_agent()
        print(f"\n Created Agent ID: {agent_id}")
        print(f"\n Add this to your .env:")
        print(f"   ELEVENLABS_AGENT_ID={agent_id}")
        print(f"\n Or use directly in frontend widget:")
        print(f'   <elevenlabs-convai agent-id="{agent_id}"></elevenlabs-convai>\n')
    except Exception as err:
        print(f"\n Error creating agent: {err}", file=sys.stderr)
        sys.exit(1)
