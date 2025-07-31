// src/lib/python.ts
export async function runPythonAgent(prompt: string): Promise<string> {
  try {
    const res = await fetch("http://agentic-ai:8000/run-task", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ task: prompt }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`AgenticAI call failed: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    return data.result as string;
  } catch (error) {
    console.error("❌ Error calling Python AI agent:", error);
    return "⚠️ Python agent failed to respond.";
  }
}
