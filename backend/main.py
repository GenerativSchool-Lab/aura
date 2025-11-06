from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="Hospital Emergency Multimodal Assistant API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    return {"status": "healthy"}

@app.post("/chat", response_model=MessageResponse)
async def chat(request: MessageRequest):
    # TODO: Integrate Mistral multimodal model
    return MessageResponse(response="Assistant response will be implemented here")

