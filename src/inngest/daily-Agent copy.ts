
import { inngest } from "./client";
import {
  createAgent,
  openai,
  type TextMessage,
} from "@inngest/agent-kit";
import { prisma } from "@/lib/db";
import {
  Message as PrismaMessage,
  MessageRole,
  MessageType,
} from "@/generated/prisma";
import { Daily_PROMPT, Dashboard_designer } from "../../prompt";

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

    // Step 3: Create the response agent
    const agent = createAgent({
      name: "daily-response-agent",
      description: "Simple Q&A assistant",
      system: Dashboard_designer,
      model: openai({
        model: "gpt-4o",
        defaultParameters: { temperature: 0.5 },
      }),
    });

    // Step 4: Convert history to plain string prompt
    const prompt = history.map((m) => `${m.role}: ${m.content}`).join("\n");

    const { output } = await agent.run(prompt);

    // Step 5: Extract assistant response safely
    const first = output[0] as TextMessage | undefined;

    const assistantResponse =
      typeof first?.content === "string"
        ? first.content
        : Array.isArray(first?.content)
        ? first.content.join("")
        : "Here you go.";

    // Step 6: Save assistant message with required fragment
    await prisma.message.create({
      data: {
        projectId,
        content:  assistantResponse,
        role:     MessageRole.ASSISTANT,
        type:     MessageType.ASSISTANT,  // or MessageType.RESULT if you prefer
      },
    });

    return { response: assistantResponse };
  }
);
