import logging
from typing import Optional, List, Dict, Any, Generator
from app.config import settings

logger = logging.getLogger(__name__)

try:
    from elevenlabs.client import ElevenLabs
    from elevenlabs import VoiceSettings
    HAS_ELEVENLABS_SDK = True
except ImportError:
    HAS_ELEVENLABS_SDK = False
    logger.warning("ElevenLabs SDK not installed. Install with `pip install elevenlabs`.")


class ElevenLabsService:
    """
    ElevenLabs Conversational AI Agent & Text-To-Speech Service.
    
    Integrates ElevenLabs Conversational Agents for live voice Feynman debriefs
    and provides high-fidelity audio synthesis.
    """

    def __init__(self):
        self._client: Optional["ElevenLabs"] = None

    @property
    def client(self) -> "ElevenLabs":
        """Lazy-loaded ElevenLabs client singleton."""
        if not HAS_ELEVENLABS_SDK:
            raise RuntimeError(
                "ElevenLabs SDK is not installed. Please run: pip install elevenlabs"
            )

        if not settings.has_elevenlabs_key:
            raise ValueError(
                "ELEVENLABS_API_KEY is not set. Please configure it in backend/.env"
            )

        if self._client is None:
            self._client = ElevenLabs(api_key=settings.ELEVENLABS_API_KEY)

        return self._client

    # -------------------------------------------------------------------------
    # Conversational AI (ElevenAgent) Operations
    # -------------------------------------------------------------------------

    def get_signed_url(self, agent_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Generates a temporary signed WebSocket URL to start a Conversational AI session.
        
        The frontend uses this URL to connect directly to the ElevenAgent via WebSockets/WebRTC
        without exposing the secret API key to the client browser.
        
        :param agent_id: Optional agent ID. Defaults to settings.ELEVENLABS_AGENT_ID if not provided.
        :return: Dict containing 'signed_url' and 'agent_id'.
        """
        target_agent_id = agent_id or settings.ELEVENLABS_AGENT_ID
        if not target_agent_id:
            raise ValueError(
                "No ElevenLabs Agent ID provided. Set ELEVENLABS_AGENT_ID in backend/.env or pass agent_id."
            )

        response = self.client.conversational_ai.conversations.get_signed_url(
            agent_id=target_agent_id
        )

        return {
            "signed_url": response.signed_url,
            "agent_id": target_agent_id,
        }

    def list_agents(self) -> List[Dict[str, Any]]:
        """
        Lists all Conversational AI agents configured under the ElevenLabs account.
        """
        response = self.client.conversational_ai.agents.list()
        agents_list = getattr(response, "agents", [])
        
        result = []
        for agent in agents_list:
            result.append({
                "agent_id": getattr(agent, "agent_id", None) or getattr(agent, "id", None),
                "name": getattr(agent, "name", "Unnamed Agent"),
                "created_at_unix": getattr(agent, "created_at_unix", None),
                "access_level": getattr(agent, "access_level", None),
            })
        return result

    def get_agent_details(self, agent_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Retrieves detailed configuration and prompt metadata for a specific agent.
        """
        target_agent_id = agent_id or settings.ELEVENLABS_AGENT_ID
        if not target_agent_id:
            raise ValueError("No agent_id provided or configured in settings.")

        agent = self.client.conversational_ai.agents.get(agent_id=target_agent_id)
        return {
            "agent_id": getattr(agent, "agent_id", target_agent_id),
            "name": getattr(agent, "name", "Unknown"),
            "conversation_config": getattr(agent, "conversation_config", None),
        }

    def get_conversation_history(self, conversation_id: str) -> Dict[str, Any]:
        """
        Retrieves transcript and details for a completed conversational session.
        Useful for auto-generating journal summaries from spoken voice debriefs.
        """
        conv = self.client.conversational_ai.conversations.get(
            conversation_id=conversation_id
        )
        return {
            "conversation_id": conversation_id,
            "status": getattr(conv, "status", None),
            "transcript": getattr(conv, "transcript", []),
            "analysis": getattr(conv, "analysis", None),
        }

    # -------------------------------------------------------------------------
    # Text-To-Speech (TTS) Synthesis
    # -------------------------------------------------------------------------

    def synthesize_speech(
        self,
        text: str,
        voice_id: Optional[str] = None,
        model_id: Optional[str] = None,
    ) -> bytes:
        """
        Converts text to MP3 audio bytes using ElevenLabs text-to-speech.
        
        :param text: Text string to speak.
        :param voice_id: Voice ID to use (defaults to settings.ELEVENLABS_VOICE_ID).
        :param model_id: Model ID to use (defaults to settings.ELEVENLABS_MODEL_ID).
        :return: MP3 audio bytes.
        """
        target_voice = voice_id or settings.ELEVENLABS_VOICE_ID
        target_model = model_id or settings.ELEVENLABS_MODEL_ID

        audio_generator = self.client.text_to_speech.convert(
            voice_id=target_voice,
            text=text,
            model_id=target_model,
        )

        # Collect generator stream into complete bytes
        if isinstance(audio_generator, (bytes, bytearray)):
            return bytes(audio_generator)
        
        audio_chunks = []
        for chunk in audio_generator:
            if chunk:
                audio_chunks.append(chunk)

        return b"".join(audio_chunks)

    def stream_speech(
        self,
        text: str,
        voice_id: Optional[str] = None,
        model_id: Optional[str] = None,
    ) -> Generator[bytes, None, None]:
        """
        Streams audio chunks as they are generated for fast low-latency audio responses.
        """
        target_voice = voice_id or settings.ELEVENLABS_VOICE_ID
        target_model = model_id or settings.ELEVENLABS_MODEL_ID

        return self.client.text_to_speech.convert(
            voice_id=target_voice,
            text=text,
            model_id=target_model,
        )


# Global service instance
eleven_service = ElevenLabsService()
