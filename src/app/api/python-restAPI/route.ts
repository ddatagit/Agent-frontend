export async function runPythonAgent(task: string): Promise<string> {
  try {
    const res = await fetch("http://localhost:8000/run-task", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // "x-api-key": process.env.AGENTIC_API_KEY!, // Uncomment if secured
      },
      body: JSON.stringify({ task }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`AgenticAI call failed: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    return data.result as string;
  } catch (error) {
    console.error("Error calling Python AI agent:", error);
    return "⚠️ Python agent failed to respond.";
  }
}
