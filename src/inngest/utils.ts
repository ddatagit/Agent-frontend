import {Sandbox} from "@e2b/code-interpreter";
import { AgentResult, TextMessage } from "@inngest/agent-kit";

export async function getSandbox(sandboxId: string){
    const sandbox = await Sandbox.connect(sandboxId);
    await sandbox.setTimeout(30 * 60 * 1000);
    return sandbox
}

export function lastAssistantTextMessageContent(result: any): string | undefined {
  const messages: any[] = result.output ?? [];

  const lastIndex = messages.findLastIndex((m) => m.role === "assistant");
  const message = messages[lastIndex];

  if (!message) return undefined;

  if (typeof message.content === "string") {
    return message.content;
  }

  if (Array.isArray(message.content)) {
    return message.content.map((c: { text: string }) => c.text).join("");
  }

  return undefined;
}
