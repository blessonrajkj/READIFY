import os
import httpx
from abc import ABC, abstractmethod
from typing import Dict, Any, List
import edge_tts
from mutagen.mp3 import MP3
import logging
from app.config import settings

logger = logging.getLogger(__name__)

class TTSProvider(ABC):
    @abstractmethod
    async def synthesize(self, text: str, output_path: str, voice: str) -> float:
        """Synthesizes text to an MP3 file at output_path and returns the duration in seconds."""
        pass

    @abstractmethod
    def get_available_voices(self, language: str) -> List[Dict[str, str]]:
        """Returns list of available voices for a given language code (e.g. 'en', 'hi', 'ta')."""
        pass

class EdgeTTSProvider(TTSProvider):
    # Mapping languages to natural-sounding Microsoft Edge neural voices
    VOICE_MAPPING = {
        "en": [
            {"id": "en-US-AriaNeural", "name": "Natural Female (Aria)", "gender": "Female"},
            {"id": "en-US-GuyNeural", "name": "Natural Male (Guy)", "gender": "Male"},
            {"id": "en-GB-SoniaNeural", "name": "Calm Female (Sonia)", "gender": "Female"},
            {"id": "en-US-JennyNeural", "name": "Narrator (Jenny)", "gender": "Female"}
        ],
        "ta": [
            {"id": "ta-IN-ValluvarNeural", "name": "Natural Male (Valluvar)", "gender": "Male"},
            {"id": "ta-IN-PallaviNeural", "name": "Natural Female (Pallavi)", "gender": "Female"}
        ],
        "hi": [
            {"id": "hi-IN-MadhurNeural", "name": "Natural Male (Madhur)", "gender": "Male"},
            {"id": "hi-IN-SwararaNeural", "name": "Natural Female (Swarara)", "gender": "Female"}
        ]
    }

    async def synthesize(self, text: str, output_path: str, voice: str) -> float:
        # Default voice if not mapped
        if not voice:
            voice = "en-US-AriaNeural"
            
        logger.info(f"Synthesizing using EdgeTTS: voice='{voice}', text_len={len(text)}")
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(output_path)
        
        # Read duration
        audio = MP3(output_path)
        return float(audio.info.length)

    def get_available_voices(self, language: str) -> List[Dict[str, str]]:
        # Normalize language code (e.g. 'en-US' -> 'en')
        lang = language.split("-")[0].lower()
        return self.VOICE_MAPPING.get(lang, self.VOICE_MAPPING["en"])

class OpenAITTSProvider(TTSProvider):
    VOICES = [
        {"id": "alloy", "name": "Alloy (Neutral)", "gender": "Neutral"},
        {"id": "echo", "name": "Echo (Male)", "gender": "Male"},
        {"id": "fable", "name": "Fable (Dynamic)", "gender": "Male"},
        {"id": "onyx", "name": "Onyx (Deep Male)", "gender": "Male"},
        {"id": "nova", "name": "Nova (Female)", "gender": "Female"},
        {"id": "shimmer", "name": "Shimmer (Professional)", "gender": "Female"}
    ]

    async def synthesize(self, text: str, output_path: str, voice: str) -> float:
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is not configured.")
            
        if not voice or voice not in [v["id"] for v in self.VOICES]:
            voice = "alloy"
            
        logger.info(f"Synthesizing using OpenAI TTS: voice='{voice}', text_len={len(text)}")
        
        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "tts-1",
            "voice": voice,
            "input": text
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/audio/speech",
                headers=headers,
                json=payload
            )
            
            if response.status_code != 200:
                raise RuntimeError(f"OpenAI TTS API failed ({response.status_code}): {response.text}")
                
            with open(output_path, "wb") as f:
                f.write(response.content)
                
        # Read duration
        audio = MP3(output_path)
        return float(audio.info.length)

    def get_available_voices(self, language: str) -> List[Dict[str, str]]:
        return self.VOICES

class ElevenLabsProvider(TTSProvider):
    # Standard popular ElevenLabs voices
    VOICES = [
        {"id": "21m00Tcm4TlvDq8ikWAM", "name": "Rachel (Narrator)", "gender": "Female"},
        {"id": "AZnzlk1XvdvUeBnXmlld", "name": "Domi (Calm)", "gender": "Female"},
        {"id": "EXAVITQu4vr4xnSDxMaL", "name": "Bella (Calm)", "gender": "Female"},
        {"id": "ErXwobaYiN019PkySvjV", "name": "Antoni (Deep)", "gender": "Male"},
        {"id": "TxGEqn7nUaMr2JGJmL3L", "name": "Liam (Natural)", "gender": "Male"}
    ]

    async def synthesize(self, text: str, output_path: str, voice: str) -> float:
        if not settings.ELEVENLABS_API_KEY:
            raise ValueError("ELEVENLABS_API_KEY is not configured.")
            
        if not voice:
            # Rachel
            voice = "21m00Tcm4TlvDq8ikWAM"
            
        logger.info(f"Synthesizing using ElevenLabs: voice='{voice}', text_len={len(text)}")
        
        headers = {
            "xi-api-key": settings.ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
            "accept": "audio/mpeg"
        }
        payload = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        }
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{voice}",
                headers=headers,
                json=payload
            )
            
            if response.status_code != 200:
                raise RuntimeError(f"ElevenLabs API failed ({response.status_code}): {response.text}")
                
            with open(output_path, "wb") as f:
                f.write(response.content)
                
        # Read duration
        audio = MP3(output_path)
        return float(audio.info.length)

    def get_available_voices(self, language: str) -> List[Dict[str, str]]:
        return self.VOICES

# Factory helper to instantiate the active TTS provider
def get_tts_provider() -> TTSProvider:
    provider_name = settings.TTS_PROVIDER.lower()
    if provider_name == "openai":
        return OpenAITTSProvider()
    elif provider_name == "elevenlabs":
        return ElevenLabsProvider()
    return EdgeTTSProvider() # default free neural Edge TTS
