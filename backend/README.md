# Backend API

FastAPI backend for Hospital Emergency Multimodal Assistant.

## Setup

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set environment variables:
```bash
export MISTRAL_API_KEY=your_key_here
```

4. Run the server:
```bash
uvicorn main:app --reload
```

API will be available at `http://localhost:8000`

