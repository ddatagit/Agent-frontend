import { inngest } from "./client";
import { type TextMessage } from "@inngest/agent-kit";
import { prisma } from "@/lib/db";
import {
  Message as PrismaMessage,
  MessageRole,
  MessageType,
} from "@/generated/prisma";
// Adjust the import path as needed — ensure runPythonAgent is imported from your REST API helper
import { runPythonAgent } from "@/app/api/python-restAPI/route";

export const dailyAgentFunction = inngest.createFunction(
  { id: "daily-agent" },
  { event: "daily-agent/run" },
  async ({ event, step }) => {
    const { projectId, value: userMessage } = event.data;

    // Step 1: Load and format previous messages
    const history: TextMessage[] = await step.run("load-history", async () => {
      const dbMessages: PrismaMessage[] = await prisma.message.findMany({
        where: { projectId },
        orderBy: { createdAt: "asc" },
      });

      return dbMessages.map((msg): TextMessage => ({
        type: "text",
        role: msg.role === MessageRole.ASSISTANT ? "assistant" : "user",
        content: msg.content,
      }));
    });

    // Step 2: Add latest user input
    history.push({
      type: "text",
      role: "user",
      content: userMessage,
    });

    // Step 3: Create a plain string prompt
    const prompt = history.map((m) => `${m.role}: ${m.content}`).join("\n");

    // Step 4: Call the Python agent using the REST API helper
    const assistantResponse = await step.run("call-python-agent", async () => {
      return await runPythonAgent(prompt);
    });

    // Step 5: Save assistant response to the database
    await prisma.message.create({
      data: {
        projectId,
        content: assistantResponse,
        role: MessageRole.ASSISTANT,
        type: MessageType.ASSISTANT,
      },
    });

    return { response: assistantResponse };
  }
);
