# Voice/Audio Implementation Guide

## Overview

This document outlines the implementation plan for adding voice/audio support to Aura's triage system.

## Architecture Decision

### Approach 1: Direct Voxtral API (Preferred)
- Use Mistral's Voxtral API directly for audio processing
- Pros: Native integration, optimized for Mistral ecosystem
- Cons: May have limitations on audio format/size

### Approach 2: Transcription + Mistral (Fallback)
- Transcribe audio using Whisper or Google Speech-to-Text
- Send transcribed text to Mistral for analysis
- Pros: More control, can handle any audio format
- Cons: Two-step process, potential transcription errors

### Recommended: Hybrid Approach
- Try Voxtral first
- Fallback to transcription if Voxtral unavailable or fails
- Best of both worlds

## Implementation Steps

### Step 1: Audio File Validation

```python
# backend/utils/audio_validator.py
from pydub import AudioSegment
from mutagen import File

def validate_audio_file(file: UploadFile) -> dict:
    """
    Validate audio file format, size, and duration
    Returns: {valid: bool, format: str, duration: float, error: str}
    """
    MAX_SIZE = 25 * 1024 * 1024  # 25MB
    MAX_DURATION = 300  # 5 minutes
    
    # Check file size
    if file.size > MAX_SIZE:
        return {"valid": False, "error": "File too large (max 25MB)"}
    
    # Check format
    allowed_formats = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg', 'audio/webm']
    if file.content_type not in allowed_formats:
        return {"valid": False, "error": f"Unsupported format: {file.content_type}"}
    
    # Validate duration (requires reading file)
    # Implementation depends on chosen approach
    
    return {"valid": True, "format": file.content_type}
```

### Step 2: Audio Preprocessing

```python
# backend/utils/audio_processor.py
from pydub import AudioSegment
import io

def preprocess_audio(audio_bytes: bytes, input_format: str) -> bytes:
    """
    Convert audio to standard format for API
    Returns: WAV format, 16kHz, mono
    """
    audio = AudioSegment.from_file(io.BytesIO(audio_bytes), format=input_format.split('/')[-1])
    
    # Convert to standard format
    audio = audio.set_frame_rate(16000)  # 16kHz
    audio = audio.set_channels(1)  # Mono
    
    # Export to WAV
    wav_buffer = io.BytesIO()
    audio.export(wav_buffer, format="wav")
    
    return wav_buffer.getvalue()
```

### Step 3: Voxtral Integration

```python
# In backend/main.py
async def process_audio_with_voxtral(audio_bytes: bytes, patient_context: str) -> str:
    """
    Process audio using Voxtral API
    """
    # Convert to base64
    audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
    
    # Check Voxtral API documentation for exact endpoint
    # This is a placeholder based on expected API structure
    try:
        response = mistral_client.chat.complete(
            model="voxtral-large-latest",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert emergency department triage nurse. Analyze the audio and provide triage assessment in JSON format."
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": patient_context},
                        {"type": "audio", "audio": f"data:audio/wav;base64,{audio_base64}"}
                    ]
                }
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        # Fallback to transcription
        return await process_audio_with_transcription(audio_bytes, patient_context)
```

### Step 4: Transcription Fallback

```python
# backend/utils/transcription.py
import whisper

# Load model once at startup
whisper_model = None

def load_whisper_model():
    global whisper_model
    if whisper_model is None:
        whisper_model = whisper.load_model("base")  # or "small", "medium", "large"
    return whisper_model

async def transcribe_audio(audio_bytes: bytes) -> str:
    """
    Transcribe audio using Whisper
    """
    model = load_whisper_model()
    
    # Save to temporary file
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
        tmp_file.write(audio_bytes)
        tmp_path = tmp_file.name
    
    try:
        result = model.transcribe(tmp_path)
        return result["text"]
    finally:
        os.unlink(tmp_path)
```

### Step 5: Update Triage Endpoint

```python
# In backend/main.py - update process_multimodal_triage function

elif input_type == "audio" and file_base64:
    # Try Voxtral first
    try:
        audio_bytes = base64.b64decode(file_base64)
        processed_audio = preprocess_audio(audio_bytes, file.content_type)
        
        # Try Voxtral
        response_text = await process_audio_with_voxtral(processed_audio, patient_context)
    except Exception as e:
        # Fallback to transcription
        transcription = await transcribe_audio(processed_audio)
        response_text = await process_text_with_mistral(
            f"{patient_context}\n\nTranscribed audio: {transcription}",
            model="mistral-large-latest"
        )
```

## Frontend Updates

### Audio Upload UI Enhancement

```typescript
// Add to frontend/app/page.tsx

// Show audio duration
const [audioDuration, setAudioDuration] = useState<number | null>(null)

const handleAudioFile = (file: File) => {
  if (file.type.startsWith('audio/')) {
    const audio = new Audio()
    audio.src = URL.createObjectURL(file)
    audio.onloadedmetadata = () => {
      setAudioDuration(audio.duration)
    }
  }
}

// Display audio info
{file && file.type.startsWith('audio/') && (
  <div className="mt-2 text-xs text-gray-600">
    Duration: {audioDuration ? `${Math.round(audioDuration)}s` : 'Loading...'}
    Format: {file.type}
  </div>
)}
```

## Testing Checklist

- [ ] Test with MP3 files
- [ ] Test with WAV files
- [ ] Test with M4A files
- [ ] Test with OGG files
- [ ] Test with files > 10MB
- [ ] Test with files > 5 minutes
- [ ] Test with corrupted audio files
- [ ] Test with background noise
- [ ] Test Voxtral API integration
- [ ] Test transcription fallback
- [ ] Test error handling
- [ ] Test processing timeouts

## Performance Considerations

- Audio preprocessing: Should be < 5 seconds
- Voxtral API call: Should be < 30 seconds
- Transcription (Whisper): Should be < 60 seconds for 5-minute audio
- Total processing: Target < 90 seconds

## Security Considerations

- Validate audio file types strictly
- Limit file sizes
- Sanitize transcribed text
- Rate limit audio processing endpoints
- Monitor for abuse

## Future Enhancements

- Real-time audio streaming
- Multiple language support
- Audio quality assessment
- Noise reduction preprocessing
- Speaker identification (if multiple speakers)

