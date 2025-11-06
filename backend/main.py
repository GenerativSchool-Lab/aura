import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from mistralai import Mistral
import json

app = FastAPI(title="Hospital Emergency Multimodal Assistant API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Mistral client
mistral_api_key = os.getenv("MISTRAL_API_KEY")
mistral_client = None
if mistral_api_key:
    mistral_client = Mistral(api_key=mistral_api_key)

class TriageRequest(BaseModel):
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    chief_complaint: str
    symptoms: str
    vital_signs: Optional[dict] = None
    medical_history: Optional[str] = None
    current_medications: Optional[str] = None
    allergies: Optional[str] = None

class TriageResponse(BaseModel):
    severity_score: int
    severity_level: str
    triage_assessment: str
    recommended_service: str
    urgency: str
    reasoning: str

class MessageRequest(BaseModel):
    message: str
    image_url: Optional[str] = None

class MessageResponse(BaseModel):
    response: str

@app.get("/")
async def root():
    return {"message": "Hospital Emergency Multimodal Assistant API"}

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "mistral_configured": mistral_client is not None
    }

@app.post("/triage", response_model=TriageResponse)
async def triage(request: TriageRequest):
    """
    Perform emergency triage assessment with severity scoring and service routing
    """
    if not mistral_client:
        # Fallback response when Mistral is not configured
        return TriageResponse(
            severity_score=5,
            severity_level="Moderate",
            triage_assessment="AI model not configured. Please set MISTRAL_API_KEY environment variable.",
            recommended_service="Emergency Department - General",
            urgency="Moderate",
            reasoning="System awaiting API key configuration"
        )
    
    # Build prompt for Mistral
    prompt = f"""You are an expert emergency department triage nurse. Analyze the following patient information and provide a comprehensive triage assessment.

Patient Information:
- Age: {request.patient_age or 'Not provided'}
- Gender: {request.patient_gender or 'Not provided'}
- Chief Complaint: {request.chief_complaint}
- Symptoms: {request.symptoms}
- Vital Signs: {json.dumps(request.vital_signs) if request.vital_signs else 'Not provided'}
- Medical History: {request.medical_history or 'Not provided'}
- Current Medications: {request.current_medications or 'Not provided'}
- Allergies: {request.allergies or 'Not provided'}

Provide your assessment in the following JSON format:
{{
    "severity_score": <integer 1-10, where 1=critical/immediate, 5=moderate, 10=non-urgent>,
    "severity_level": "<Critical/High/Moderate/Low/Non-urgent>",
    "triage_assessment": "<Detailed assessment of the patient's condition>",
    "recommended_service": "<Specific department or service: e.g., 'Cardiology', 'Trauma Center', 'Pediatric Emergency', 'General Emergency', 'Psychiatric Emergency', 'Orthopedics', etc.>",
    "urgency": "<Immediate/Urgent/Moderate/Low/Non-urgent>",
    "reasoning": "<Explanation of the severity score and routing decision>"
}}

Respond ONLY with valid JSON, no additional text."""

    try:
        # Call Mistral API
        response = mistral_client.chat.complete(
            model="mistral-large-latest",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert emergency department triage nurse. Always respond with valid JSON only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3
        )
        
        # Parse response
        response_text = response.choices[0].message.content.strip()
        
        # Try to extract JSON from response
        try:
            # Remove markdown code blocks if present
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            triage_data = json.loads(response_text)
            
            return TriageResponse(
                severity_score=triage_data.get("severity_score", 5),
                severity_level=triage_data.get("severity_level", "Moderate"),
                triage_assessment=triage_data.get("triage_assessment", "Assessment completed"),
                recommended_service=triage_data.get("recommended_service", "Emergency Department - General"),
                urgency=triage_data.get("urgency", "Moderate"),
                reasoning=triage_data.get("reasoning", "Assessment based on provided information")
            )
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            return TriageResponse(
                severity_score=5,
                severity_level="Moderate",
                triage_assessment="Unable to parse AI response. Please review manually.",
                recommended_service="Emergency Department - General",
                urgency="Moderate",
                reasoning=response_text[:200] if response_text else "Error parsing response"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calling Mistral API: {str(e)}"
        )

@app.post("/chat", response_model=MessageResponse)
async def chat(request: MessageRequest):
    if not mistral_client:
        return MessageResponse(response="Mistral API not configured. Please set MISTRAL_API_KEY environment variable.")
    
    try:
        response = mistral_client.chat.complete(
            model="mistral-large-latest",
            messages=[
                {"role": "user", "content": request.message}
            ]
        )
        return MessageResponse(response=response.choices[0].message.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
