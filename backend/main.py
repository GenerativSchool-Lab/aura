import os
import base64
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from mistralai import Mistral
import json
import mimetypes
from clinical_scoring import get_clinical_scoring_guidelines, convert_score_100_to_10

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
    chief_complaint: Optional[str] = None
    symptoms: Optional[str] = None
    vital_signs: Optional[dict] = None
    medical_history: Optional[str] = None
    current_medications: Optional[str] = None
    allergies: Optional[str] = None
    input_type: Optional[str] = "text"  # text, image, video, audio

class TriageResponse(BaseModel):
    severity_score: int
    severity_level: str
    triage_assessment: str
    recommended_service: str
    urgency: str
    reasoning: str
    model_used: str

def determine_model(input_type: str, file_content: bytes = None) -> str:
    """Determine which Mistral model to use based on input type"""
    if input_type == "image" or (file_content and file_content.startswith(b'\x89PNG') or file_content.startswith(b'\xff\xd8')):
        return "pixtral-large-latest"  # Pixtral for images
    elif input_type in ["video", "audio"] or (file_content and file_content.startswith(b'RIFF')):
        return "voxtral-large-latest"  # Voxtral for audio/video
    else:
        return "mistral-large-latest"  # Mistral for text

async def process_multimodal_triage(
    text_input: Optional[str] = None,
    file: Optional[UploadFile] = None,
    patient_age: Optional[int] = None,
    patient_gender: Optional[str] = None,
    vital_signs: Optional[str] = None,
    medical_history: Optional[str] = None,
    current_medications: Optional[str] = None,
    allergies: Optional[str] = None
):
    """Process triage with multimodal input"""
    if not mistral_client:
        return TriageResponse(
            severity_score=5,
            severity_level="Moderate",
            triage_assessment="AI model not configured. Please set MISTRAL_API_KEY environment variable.",
            recommended_service="Emergency Department - General",
            urgency="Moderate",
            reasoning="System awaiting API key configuration",
            model_used="none"
        )
    
    # Determine input type and model
    input_type = "text"
    file_content = None
    file_base64 = None
    
    if file:
        file_content = await file.read()
        content_type = file.content_type or ""
        
        if "image" in content_type:
            input_type = "image"
        elif "video" in content_type:
            input_type = "video"
        elif "audio" in content_type:
            input_type = "audio"
        
        file_base64 = base64.b64encode(file_content).decode('utf-8')
    
    model = determine_model(input_type, file_content)
    
    # Build context from patient info
    patient_context = f"""Patient Information:
- Age: {patient_age or 'Not provided'}
- Gender: {patient_gender or 'Not provided'}
- Vital Signs: {vital_signs or 'Not provided'}
- Medical History: {medical_history or 'Not provided'}
- Current Medications: {current_medications or 'Not provided'}
- Allergies: {allergies or 'Not provided'}"""
    
    # Build messages based on input type
    messages = []
    
    if input_type == "image" and file_base64:
        # Pixtral for images
        messages.append({
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": f"""You are an expert emergency department triage nurse. Analyze this medical image and the following patient information to provide a comprehensive triage assessment using evidence-based clinical scoring systems.

{patient_context}
{('Chief Complaint: ' + text_input) if text_input else ''}
{('Symptoms: ' + text_input) if text_input and not patient_context else ''}

{get_clinical_scoring_guidelines(patient_age)}

CRITICAL INSTRUCTIONS:
1. Identify ALL clinical signs visible in the image AND described in the text
2. Assign a score (0-100) for EACH sign according to the clinical scoring tables
3. Use the MAXIMUM score (not average) to determine overall severity
4. Convert the maximum score to severity_score (1-10) using the conversion mapping
5. Ensure severity_score, severity_level, and urgency are consistent

CONVERSION MAPPING (MANDATORY):
- Clinical score 90-100 → severity_score 1-2 → severity_level "Critical" → urgency "Immediate"
- Clinical score 70-89 → severity_score 3-4 → severity_level "High" → urgency "Urgent"
- Clinical score 50-69 → severity_score 5-6 → severity_level "Moderate" → urgency "Moderate"
- Clinical score 30-49 → severity_score 7-8 → severity_level "Low" → urgency "Low"
- Clinical score 0-29 → severity_score 9-10 → severity_level "Non-urgent" → urgency "Non-urgent"

Provide your assessment in the following JSON format:
{{
    "clinical_score_100": <float 0-100, the maximum score from identified clinical signs>,
    "severity_score": <integer 1-10, converted from clinical_score_100 using mapping above>,
    "severity_level": "<MUST match severity_score: Critical(1-2)/High(3-4)/Moderate(5-6)/Low(7-8)/Non-urgent(9-10)>",
    "triage_assessment": "<Detailed assessment identifying all clinical signs found in image and text, with their scores>",
    "recommended_service": "<Specific department or service>",
    "urgency": "<MUST match severity_score: Immediate(1-2)/Urgent(3-4)/Moderate(5-6)/Low(7-8)/Non-urgent(9-10)>",
    "reasoning": "<Detailed explanation: (1) Clinical signs identified in image, (2) Clinical signs from text, (3) Score assigned to each sign (0-100), (4) Maximum score selected, (5) Conversion to severity_score 1-10, (6) Clinical justification for routing>"
}}

Respond ONLY with valid JSON, no additional text."""
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:{file.content_type};base64,{file_base64}"
                    }
                }
            ]
        })
    elif input_type in ["video", "audio"] and file_base64:
        # Voxtral for audio/video
        messages.append({
            "role": "user",
            "content": f"""You are an expert emergency department triage nurse. Analyze this {input_type} recording and the following patient information to provide a comprehensive triage assessment using evidence-based clinical scoring systems.

{patient_context}
{('Additional notes: ' + text_input) if text_input else ''}

{get_clinical_scoring_guidelines(patient_age)}

CRITICAL INSTRUCTIONS:
1. Transcribe and identify ALL clinical signs from the {input_type} recording
2. Assign a score (0-100) for EACH sign according to the clinical scoring tables
3. Use the MAXIMUM score (not average) to determine overall severity
4. Convert the maximum score to severity_score (1-10) using the conversion mapping
5. Ensure severity_score, severity_level, and urgency are consistent

CONVERSION MAPPING (MANDATORY):
- Clinical score 90-100 → severity_score 1-2 → severity_level "Critical" → urgency "Immediate"
- Clinical score 70-89 → severity_score 3-4 → severity_level "High" → urgency "Urgent"
- Clinical score 50-69 → severity_score 5-6 → severity_level "Moderate" → urgency "Moderate"
- Clinical score 30-49 → severity_score 7-8 → severity_level "Low" → urgency "Low"
- Clinical score 0-29 → severity_score 9-10 → severity_level "Non-urgent" → urgency "Non-urgent"

Provide your assessment in the following JSON format:
{{
    "clinical_score_100": <float 0-100, the maximum score from identified clinical signs>,
    "severity_score": <integer 1-10, converted from clinical_score_100 using mapping above>,
    "severity_level": "<MUST match severity_score: Critical(1-2)/High(3-4)/Moderate(5-6)/Low(7-8)/Non-urgent(9-10)>",
    "triage_assessment": "<Detailed assessment identifying all clinical signs found in {input_type} and text, with their scores>",
    "recommended_service": "<Specific department or service>",
    "urgency": "<MUST match severity_score: Immediate(1-2)/Urgent(3-4)/Moderate(5-6)/Low(7-8)/Non-urgent(9-10)>",
    "reasoning": "<Detailed explanation: (1) Clinical signs identified in {input_type}, (2) Clinical signs from text, (3) Score assigned to each sign (0-100), (4) Maximum score selected, (5) Conversion to severity_score 1-10, (6) Clinical justification for routing>"
}}

Respond ONLY with valid JSON, no additional text."""
        })
        # Note: Voxtral API might need different handling - this is a placeholder
        # Actual implementation may require transcription first
    else:
        # Mistral for text
        # Get clinical scoring guidelines based on patient age
        clinical_guidelines = get_clinical_scoring_guidelines(patient_age)
        
        prompt = f"""You are an expert emergency department triage nurse. Analyze the following patient information and provide a comprehensive triage assessment using evidence-based clinical scoring systems.

{patient_context}
{('Chief Complaint: ' + text_input) if text_input else 'No chief complaint provided'}
{('Symptoms: ' + text_input) if text_input else 'No symptoms provided'}

{clinical_guidelines}

CRITICAL INSTRUCTIONS:
1. Identify ALL clinical signs present in the patient description
2. Assign a score (0-100) for EACH sign according to the clinical scoring tables above
3. Use the MAXIMUM score (not average) to determine overall severity
4. Convert the maximum score to severity_score (1-10) using the conversion mapping
5. Ensure severity_score, severity_level, and urgency are consistent

CONVERSION MAPPING (MANDATORY):
- Clinical score 90-100 → severity_score 1-2 → severity_level "Critical" → urgency "Immediate"
- Clinical score 70-89 → severity_score 3-4 → severity_level "High" → urgency "Urgent"
- Clinical score 50-69 → severity_score 5-6 → severity_level "Moderate" → urgency "Moderate"
- Clinical score 30-49 → severity_score 7-8 → severity_level "Low" → urgency "Low"
- Clinical score 0-29 → severity_score 9-10 → severity_level "Non-urgent" → urgency "Non-urgent"

Provide your assessment in the following JSON format:
{{
    "clinical_score_100": <float 0-100, the maximum score from identified clinical signs>,
    "severity_score": <integer 1-10, converted from clinical_score_100 using mapping above>,
    "severity_level": "<MUST match severity_score: Critical(1-2)/High(3-4)/Moderate(5-6)/Low(7-8)/Non-urgent(9-10)>",
    "triage_assessment": "<Detailed assessment identifying all clinical signs found and their scores>",
    "recommended_service": "<Specific department or service: e.g., 'Cardiology', 'Trauma Center', 'Pediatric Emergency', 'General Emergency', 'Psychiatric Emergency', 'Orthopedics', etc.>",
    "urgency": "<MUST match severity_score: Immediate(1-2)/Urgent(3-4)/Moderate(5-6)/Low(7-8)/Non-urgent(9-10)>",
    "reasoning": "<Detailed explanation: (1) List all clinical signs identified, (2) Score assigned to each sign (0-100), (3) Maximum score selected, (4) Conversion to severity_score 1-10, (5) Clinical justification for routing decision>"
}}

Respond ONLY with valid JSON, no additional text."""
        
        messages.append({
            "role": "system",
            "content": "You are an expert emergency department triage nurse. Always respond with valid JSON only."
        })
        messages.append({
            "role": "user",
            "content": prompt
        })
    
    try:
        # Call appropriate Mistral API
        if input_type == "image" and file_base64:
            response = mistral_client.chat.complete(
                model=model,
                messages=messages,
                temperature=0.3
            )
        elif input_type in ["video", "audio"]:
            # For now, use text model with note about audio/video
            # Full Voxtral integration may require additional setup
            response = mistral_client.chat.complete(
                model="mistral-large-latest",  # Fallback until Voxtral is fully available
                messages=messages,
                temperature=0.3
            )
        else:
            response = mistral_client.chat.complete(
                model=model,
                messages=messages,
                temperature=0.3
            )
        
        # Parse response
        response_text = response.choices[0].message.content.strip()
        
        # Try to extract JSON from response
        try:
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            triage_data = json.loads(response_text)
            
            # Get clinical score if provided, otherwise use severity_score
            clinical_score_100 = triage_data.get("clinical_score_100")
            score = triage_data.get("severity_score", 5)
            
            # If clinical_score_100 is provided, validate and convert
            if clinical_score_100 is not None:
                # Ensure clinical score is in valid range
                clinical_score_100 = max(0, min(100, float(clinical_score_100)))
                # Convert to 1-10 scale
                score = convert_score_100_to_10(clinical_score_100)
            
            # Validate and enforce consistency between score and level
            level = triage_data.get("severity_level", "Moderate")
            urgency = triage_data.get("urgency", "Moderate")
            
            # Enforce correct mapping based on score
            if score <= 2:
                level = "Critical"
                urgency = "Immediate"
            elif score <= 4:
                level = "High"
                urgency = "Urgent"
            elif score <= 6:
                level = "Moderate"
                urgency = "Moderate"
            elif score <= 8:
                level = "Low"
                urgency = "Low"
            else:  # score 9-10
                level = "Non-urgent"
                urgency = "Non-urgent"
            
            return TriageResponse(
                severity_score=score,
                severity_level=level,
                triage_assessment=triage_data.get("triage_assessment", "Assessment completed"),
                recommended_service=triage_data.get("recommended_service", "Emergency Department - General"),
                urgency=urgency,
                reasoning=triage_data.get("reasoning", "Assessment based on provided information"),
                model_used=model
            )
        except json.JSONDecodeError:
            return TriageResponse(
                severity_score=5,
                severity_level="Moderate",
                triage_assessment="Unable to parse AI response. Please review manually.",
                recommended_service="Emergency Department - General",
                urgency="Moderate",
                reasoning=response_text[:200] if response_text else "Error parsing response",
                model_used=model
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calling Mistral API: {str(e)}"
        )

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
async def triage_multimodal(
    file: Optional[UploadFile] = File(None),
    text_input: Optional[str] = Form(None),
    patient_age: Optional[int] = Form(None),
    patient_gender: Optional[str] = Form(None),
    vital_signs: Optional[str] = Form(None),
    medical_history: Optional[str] = Form(None),
    current_medications: Optional[str] = Form(None),
    allergies: Optional[str] = Form(None)
):
    """
    Perform emergency triage assessment with multimodal input support
    Supports text, image, video, and audio inputs
    """
    # Parse vital signs if provided as string
    vital_signs_dict = None
    if vital_signs:
        try:
            vital_signs_dict = json.loads(vital_signs)
        except:
            pass
    
    return await process_multimodal_triage(
        text_input=text_input,
        file=file,
        patient_age=patient_age,
        patient_gender=patient_gender,
        vital_signs=json.dumps(vital_signs_dict) if vital_signs_dict else vital_signs,
        medical_history=medical_history,
        current_medications=current_medications,
        allergies=allergies
    )
