# Agent-Python\agentic_ai.py

import os
from openai import OpenAI
from dotenv import load_dotenv

# Load env vars
load_dotenv(dotenv_path=".env.docker")

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("❌ Missing OPENAI_API_KEY in .env.docker")

# Initialize v1-style client
client = OpenAI(api_key=api_key)

class AgenticAI:
    def run_autonomous_task(self, task: str) -> str:
        print(f"🧠 Running task: {task}")
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": task}
                ],
                temperature=0.7,
                max_tokens=800,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"❌ Error during OpenAI call: {e}")
            return "⚠️ Failed to get response from OpenAI."
