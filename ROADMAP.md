# Aura Development Roadmap

## 🎯 Current Status (v0.1.0)

✅ **Completed:**
- Text-based triage with Mistral
- Image analysis with Pixtral
- Basic UI with drag-and-drop
- Severity scoring and service routing
- Patient information forms
- Deployment on Railway (backend) and Vercel (frontend)

## 🚀 Phase 1: Voice/Audio Support (Priority)

### Goal
Enable voice/audio input for triage assessment using Voxtral or audio transcription + Mistral.

### Dependencies Needed

#### Backend Dependencies
```python
# Audio Processing
pydub==0.25.1          # Audio file manipulation and format conversion
ffmpeg-python==0.2.0   # FFmpeg wrapper for audio processing (requires system FFmpeg)
wave==0.0.2            # WAV file handling (built-in, but may need updates)
librosa==0.10.1        # Audio analysis and feature extraction (optional, for advanced processing)

# Speech Recognition (if using transcription approach)
openai-whisper==20231117  # OpenAI Whisper for speech-to-text (alternative to Voxtral)
# OR
speech-recognition==3.10.0  # Google Speech Recognition API wrapper
# OR use Mistral's Voxtral API directly

# Audio Format Support
mutagen==1.47.0        # Audio metadata reading
```

#### System Dependencies (Dockerfile)
```dockerfile
# Add to Dockerfile
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*
```

### Implementation Steps

1. **Audio File Handling**
   - [ ] Add audio file validation (format, size, duration)
   - [ ] Implement audio format conversion (MP3, WAV, M4A → supported format)
   - [ ] Add audio duration limits (e.g., max 5 minutes)
   - [ ] Implement audio preprocessing (noise reduction, normalization)

2. **Voxtral Integration**
   - [ ] Research Voxtral API endpoints and requirements
   - [ ] Implement Voxtral client integration
   - [ ] Handle audio file encoding for API (base64 or direct upload)
   - [ ] Process Voxtral responses for triage assessment

3. **Fallback: Transcription Approach**
   - [ ] If Voxtral not available, implement Whisper transcription
   - [ ] Send transcribed text to Mistral for analysis
   - [ ] Maintain same response format

4. **Backend API Updates**
   - [ ] Update `/triage` endpoint to handle audio files
   - [ ] Add audio-specific error handling
   - [ ] Implement audio file size validation
   - [ ] Add audio processing timeouts

5. **Frontend Updates**
   - [ ] Add audio recording capability (optional)
   - [ ] Improve audio file upload UI
   - [ ] Show audio duration and format info
   - [ ] Add audio playback preview
   - [ ] Display transcription if using fallback method

### Technical Considerations

**Voxtral API Approach:**
- Check if Voxtral supports direct audio file upload
- May need to convert audio to specific format (WAV, MP3)
- Handle streaming responses if available
- Error handling for unsupported audio formats

**Transcription Fallback:**
- Use OpenAI Whisper for high-quality transcription
- Alternative: Google Speech-to-Text API
- Process transcribed text through existing Mistral pipeline
- Maintain consistency with text-based triage

**Audio Processing:**
- Convert all audio to consistent format (e.g., WAV 16kHz mono)
- Limit file sizes (e.g., max 25MB)
- Limit duration (e.g., max 5 minutes)
- Validate audio quality (sample rate, channels)

### Testing Requirements
- [ ] Test with various audio formats (MP3, WAV, M4A, OGG)
- [ ] Test with different audio qualities
- [ ] Test with background noise
- [ ] Test with multiple languages (if supported)
- [ ] Test error handling for corrupted files
- [ ] Test with long audio files (duration limits)

## 📅 Phase 2: Enhanced Features

### 2.1 Real-time Streaming
- WebSocket support for real-time assessment updates
- Streaming transcription for long audio files
- Progress indicators for processing

### 2.2 Multi-file Support
- Upload multiple images for comprehensive analysis
- Combine multiple audio clips
- Batch processing capabilities

### 2.3 Patient History
- Store and retrieve patient triage history
- Compare current vs previous assessments
- Trend analysis

### 2.4 Advanced UI Features
- Audio waveform visualization
- Image annotation tools
- Assessment export (PDF, JSON)
- Print-friendly results

## 📅 Phase 3: Integration & Scale

### 3.1 Hospital System Integration
- HL7 FHIR integration
- Electronic Health Record (EHR) connectivity
- Patient data synchronization

### 3.2 Performance Optimization
- Caching for repeated assessments
- Async processing for large files
- CDN for static assets
- Database for patient history

### 3.3 Security & Compliance
- HIPAA compliance measures
- Data encryption at rest and in transit
- Audit logging
- User authentication and authorization
- Role-based access control

### 3.4 Analytics & Monitoring
- Usage analytics dashboard
- Performance monitoring
- Error tracking and alerting
- Model performance metrics

## 📅 Phase 4: Advanced AI Features

### 4.1 Multi-modal Fusion
- Combine text + image + audio for comprehensive assessment
- Cross-modal validation
- Confidence scoring per modality

### 4.2 Continuous Learning
- Feedback loop for model improvement
- A/B testing for different models
- Custom model fine-tuning

### 4.3 Specialized Models
- Pediatric-specific triage
- Geriatric-specific considerations
- Specialty department routing

## 🔧 Technical Debt & Improvements

- [ ] Add comprehensive error handling
- [ ] Improve API response times
- [ ] Add request rate limiting
- [ ] Implement proper logging
- [ ] Add unit and integration tests
- [ ] Improve code documentation
- [ ] Add API versioning
- [ ] Optimize Docker image size

## 📊 Success Metrics

### Phase 1 (Voice Support)
- Audio processing success rate > 95%
- Average processing time < 30 seconds
- Support for 3+ audio formats
- Transcription accuracy > 90%

### Overall
- User satisfaction score
- Average triage time reduction
- Accuracy of severity scoring
- Service routing accuracy

## 🎯 Timeline Estimate

- **Phase 1 (Voice Support)**: 2-3 weeks
  - Week 1: Dependencies, audio processing, Voxtral research
  - Week 2: API integration, backend implementation
  - Week 3: Frontend updates, testing, deployment

- **Phase 2**: 4-6 weeks
- **Phase 3**: 8-12 weeks
- **Phase 4**: Ongoing

## 📝 Notes

- Video support is deferred as it's less useful for emergency triage
- Focus on voice/audio as it's more practical for patient descriptions
- Consider mobile app for easier audio recording
- Keep backward compatibility with existing text/image features

