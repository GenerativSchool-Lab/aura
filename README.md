# Aura - Hospital Emergency Multimodal Triage Assistant

A multimodal AI-powered emergency triage system designed to assist hospital emergency departments with rapid patient assessment, severity scoring, and service routing.

## 🏥 Overview

Aura leverages advanced AI models (Mistral, Pixtral, Voxtral) to analyze patient information through multiple input modalities—text, images, video, and audio—providing instant triage assessments with severity scoring and department routing recommendations.

## ✨ Features

- **Multimodal Input Support**
  - Text descriptions (symptoms, chief complaints)
  - Medical images (X-rays, scans, photos)
  - Video recordings
  - Audio recordings

- **Intelligent Model Routing**
  - **Pixtral**: Image analysis and medical image interpretation
  - **Voxtral**: Audio and video processing
  - **Mistral**: Text-based triage and clinical reasoning

- **Comprehensive Triage Assessment**
  - Severity scoring (1-10 scale)
  - Urgency level classification
  - Department/service routing recommendations
  - Detailed clinical assessment
  - Evidence-based reasoning

- **Patient Context Integration**
  - Age and demographic information
  - Vital signs
  - Medical history
  - Current medications
  - Known allergies

- **Modern, Accessible UI**
  - Clean black & white design optimized for hospital environments
  - Drag-and-drop file uploads
  - Real-time results display
  - Mobile-responsive interface

## 🏗️ Architecture

### Backend
- **Framework**: FastAPI (Python)
- **Hosting**: Railway
- **AI Models**: Mistral AI (Mistral, Pixtral, Voxtral)
- **API**: RESTful endpoints with file upload support

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **Hosting**: Vercel
- **Styling**: Tailwind CSS
- **UI**: Modern, minimalist design

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Mistral API key

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set environment variables:
```bash
export MISTRAL_API_KEY=your_mistral_api_key_here
```

5. Run the server:
```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set environment variables:
```bash
# Create .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

4. Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## 📚 API Documentation

### Endpoints

#### `POST /triage`

Perform emergency triage assessment with multimodal input.

**Request (FormData):**
- `file` (optional): Image, video, or audio file
- `text_input` (optional): Text description of symptoms/complaint
- `patient_age` (optional): Patient age
- `patient_gender` (optional): Patient gender
- `vital_signs` (optional): Vital signs as JSON string
- `medical_history` (optional): Medical history
- `current_medications` (optional): Current medications
- `allergies` (optional): Known allergies

**Response:**
```json
{
  "severity_score": 5,
  "severity_level": "Moderate",
  "triage_assessment": "Detailed assessment...",
  "recommended_service": "Emergency Department - General",
  "urgency": "Moderate",
  "reasoning": "Clinical reasoning...",
  "model_used": "mistral-large-latest"
}
```

#### `GET /health`

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "mistral_configured": true
}
```

## 🧪 Testing

### Manual Testing

1. **Text Input Test**:
   - Enter symptoms: "Chest pain, shortness of breath"
   - Add patient age: 45
   - Submit and verify severity score and routing

2. **Image Upload Test**:
   - Upload a medical image
   - Add relevant text description
   - Verify Pixtral model is used
   - Check assessment includes image analysis

3. **Combined Input Test**:
   - Enter text description
   - Upload image
   - Fill patient information
   - Verify comprehensive assessment

## 📦 Deployment

### Railway (Backend)

1. Connect your GitHub repository
2. Set `MISTRAL_API_KEY` environment variable
3. Railway will automatically detect and deploy using Dockerfile

### Vercel (Frontend)

1. Import project from GitHub
2. Set root directory to `frontend`
3. Set `NEXT_PUBLIC_API_URL` environment variable to your Railway backend URL
4. Deploy

## 🔒 Security & Privacy

- All API communications should use HTTPS in production
- Patient data should be handled according to HIPAA/GDPR regulations
- API keys should never be committed to version control
- Consider implementing authentication for production use

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for more information.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

### Author
- **Soufiane Lemqari** - *Initial Development* - [GenerativSchool Lab](https://github.com/GenerativSchool-Lab)

### Team Members & Open Source Contributors
- **Laura Sibony** - *AI Expert* - AI model integration and optimization
- **Camille François, M.D.** - *Medical Advisor* - Clinical validation and medical expertise

### Organization
**GenerativSchool Lab** - Advancing AI applications in healthcare

## 🙏 Acknowledgments

- Mistral AI for providing powerful multimodal AI models
- The open-source community for tools and libraries
- Healthcare professionals for feedback and validation

## 📞 Support

For issues, questions, or contributions, please open an issue on GitHub or contact the GenerativSchool Lab team.

## 🔮 Future Enhancements

- Real-time streaming responses
- Multi-file upload support
- Enhanced Voxtral integration for audio/video
- Patient history tracking
- Integration with hospital information systems
- Mobile applications
- Multi-language support

---

**Disclaimer**: This tool is designed to assist healthcare professionals and should not replace clinical judgment. All assessments should be reviewed and validated by qualified medical personnel.
