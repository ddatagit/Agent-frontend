from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agentic_ai import AgenticAI
from dotenv import load_dotenv
import os

# Load OpenAI API key from .env
load_dotenv()

app = FastAPI()

# Enable CORS for development/testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the agent
agent = AgenticAI()

# Input schema
class TaskRequest(BaseModel):
    task: str

# Health check route
@app.get("/")
def root():
    return {"message": "AgenticAI API is running!"}

# Main task endpoint (no custom API key required) http://localhost:8000
@app.post("/run-task")
async def run_task(input: TaskRequest):
    print(f"🧠 Received task: {input.task}")
    try:
        result = agent.run_autonomous_task(input.task)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
