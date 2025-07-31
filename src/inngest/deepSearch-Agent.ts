// src/inngest/functions/deepsearchAgentFunction.ts
import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db";
import {
  Message as PrismaMessage,
  MessageRole,
  MessageType,
} from "@/generated/prisma";
import { runPythonAgent } from "@/lib/python";

// Type for internal message format sent to Python
interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
  type: MessageType;
}

export const DeepsearchAgentFunction = inngest.createFunction(
  { id: "search-agent" },
  { event: "search-agent/run" },
  async ({ event, step }) => {
    console.log("🔍 Deep Search agent started");

    const { projectId, value: userMessage, messageId } = event.data as {
      projectId: string;
      value: string;
      messageId?: string;
    };

    // 1. Load message history
    const history: HistoryMessage[] = await step.run("load-history", async () => {
      console.log("📜 Loading history from DB");
      const msgs = await prisma.message.findMany({
        where: { projectId },
        orderBy: { createdAt: "asc" },
      });

      return msgs.map((m): HistoryMessage => ({
        role: m.role === MessageRole.USER ? "user" : "assistant",
        content: m.content,
        type: m.type,
      }));
    });

    // 2. Append user message
    history.push({
      role: "user",
      content: userMessage,
      type: MessageType.RESULT,
    });

    // 3. Add system prompt and convert history to prompt string
    const systemPrompt = "system: You are an AI agent searching online like an expert.";
    const prompt = [systemPrompt, ...history.map((m) => `${m.role}: ${m.content}`)].join("\n");

    // 4. Call Python AgenticAI API
    const assistantResponse: string = await step.run("call-python-agent", async () => {
      console.log("🤖 Sending prompt to Python agent...");
      const response = await runPythonAgent(prompt);
      console.log("✅ Response received from Python agent.");
      return response;
    });

    // 5. Update or insert assistant message
    await step.run("update-response", async () => {
      console.log("📝 Saving assistant response to DB...");
      if (messageId) {
        await prisma.message.update({
          where: { id: messageId },
          data: { content: assistantResponse },
        });
      } else {
        await prisma.message.create({
          data: {
            projectId,
            content: assistantResponse,
            role: MessageRole.ASSISTANT,
            type: MessageType.ASSISTANT,
          },
        });
      }
    });

    return { response: assistantResponse };
  }
);


// ### ✅ Summary: What this function does

// This `DeepsearchAgentFunction`:

// 1. Loads message history from the DB
// 2. Converts it into a prompt string
// 3. Sends the prompt to your **Python backend** via `runPythonAgent(prompt)`
// 4. Saves the assistant's response into the database

// ---

// ### 🟢 When to Adjust

// If your Python backend now expects more than just a plain prompt — for example, if:

// * It automatically adds the message to a todo list
// * It prints logs to terminal
// * You want it to handle multi-step tasks, not just chat

// Then it's **perfectly fine as-is** because `runPythonAgent(prompt)` is just passing the full text to `AgenticAI.run_autonomous_task(prompt)` — which already does all the logging, task storing, etc.

// But if you want to:

// * Pass structured input (like projectId, history array)
// * Handle tool selection (e.g. force it to use `SimpleChat` or `WebSearch`)
// * Let the Python side access the todo list externally

// Then you'll want to **adjust either**:

// * This TypeScript function, to send a JSON payload
//   **or**
// * The Python backend, to accept a JSON object instead of a raw string

// ---

// ### ✅ What You Can Do Right Now

// If you're happy with your current flow, **you don't need to change anything** in this `deepsearchAgentFunction.ts`.

// But here are **optional enhancements** if you want tighter integration:

// ---

// ### ✅ \[OPTIONAL] Enhance `runPythonAgent()` to accept a payload

// In `runPythonAgent(prompt)`, modify it to send structured input:

// #### Example:

// ```ts
// await runPythonAgent({
//   projectId,
//   history,
//   currentMessage: userMessage,
// });
// ```

// Then in Python, parse it with:

// ```python
// from fastapi import Request

// @app.post("/run-task")
// async def run_task(req: Request):
//     body = await req.json()
//     prompt = body.get("currentMessage")
//     project_id = body.get("projectId")
//     history = body.get("history", [])
// ```

// ---

// ### ✅ \[OPTIONAL] Add AgenticAI-level response formatting

// If your Python agent adds todo items, you may want to return the final message + task list like:

// ```ts
// return {
//   response: assistantResponse,
//   todoList: await agent.show_tasks()
// }
// ```

// Then show it in the frontend if needed.

// ---

// ### ✅ Conclusion

// | Case                          | Do You Need Changes?                 |
// | ----------------------------- | ------------------------------------ |
// | Just sending text and logging | ❌ No changes needed                  |
// | Want to send structured input | ✅ Yes – change both sides            |
// | Want better frontend feedback | ✅ Yes – return todo list too         |
// | Want tighter tool control     | ✅ Maybe – pass tool intent to Python |

// ---

// Let me know if you want to change `runPythonAgent` to send a full structured JSON payload, and I’ll help rewrite both the Python and TypeScript side for that.
