// src/inngest/functions/deepsearchAgentFunction.ts
import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db";
import {
  Message as PrismaMessage,
  MessageRole,
  MessageType,
} from "@/generated/prisma";
import { runPythonAgent } from "@/lib/python";

export const DeepsearchAgentFunction = inngest.createFunction(
  { id: "search-agent" },
  { event: "search-agent/run" },
  async ({ event, step }) => {
    console.log("🔍 Deep Search agent started");

    const { projectId, value: userMessage, messageId } = event.data;

    // 1. Load message history
    const history = await step.run("load-history", async () => {
      console.log("📜 Loading history from DB");
      const msgs = await prisma.message.findMany({
        where: { projectId },
        orderBy: { createdAt: "asc" },
      });

      return msgs.map((m) => ({
        role: m.role === MessageRole.USER ? "user" : "assistant",
        content: m.content,
        type: m.type,
      }));
    });

    // 2. Append user message
    history.push({
      role: "user",
      type: MessageType.RESULT, 
      content: userMessage,
    });

    // 3. Build prompt
    const prompt = history.map((m) => `${m.role}: ${m.content}`).join("\n");

    // 4. Call Python agent
    const assistantResponse = await step.run("call-python-agent", async () => {
      console.log("🤖 Sending prompt to Python agent");
      return await runPythonAgent(prompt);
    });

    // 5. Update the existing assistant message instead of creating a new one
    await step.run("update-response", async () => {
      console.log("Updating assistant message in DB");
      if (messageId) {
        // Update existing message
        await prisma.message.update({
          where: { id: messageId },
          data: {
            content: assistantResponse,
          },
        });
      } else {
        // Fallback: create new message if no messageId provided
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




// // import * as fs from 'fs';
// // import * as path from 'path';
// // import { config } from 'dotenv';
// // import { OpenAi } from 'inngest';
// // import { initializeAgentExecutorWithOptions } from "langchain/agents";

// // import { AgentExecutor } from 'langchain/agents';
// // import { AgentType } from 'langchain/schema';
// // import { PythonREPLTool } from 'langchain/tools/python';
// // import { ShellTool } from 'langchain/tools/shell';
// // import { DuckDuckGoSearch } from 'langchain/tools/ddg-search';
// // import { prisma } from './lib/db';

// config();

// interface MemoryStore {
//   [key: string]: string;
// }

// interface TodoItem {
//   task: string;
//   completed: boolean;
//   created: Date;
//   completedAt?: Date;
// }

// export class AgenticAI {
//   private memory: MemoryStore = {};
//   private todoList: TodoItem[] = [];
//   private agent: AgentExecutor;

//   constructor(private apiKey: string = process.env.OPENAI_API_KEY || '') {
//     const llm = new OpenAI({
//       temperature: 0.5,
//       openAIApiKey: this.apiKey,
//       modelName: 'gpt-4o-mini',
//       maxTokens: 16000,
//       timeout: 60000,
//     });

//     const tools = this.createTools();

//     this.agent = initializeAgent({
//       agentType: 'zero-shot-react-description',
//       tools,
//       llm,
//       verbose: true,
//     });
//   }

//   private createTools(): Tool[] {
//     return [
//       new PythonREPLTool(),
//       new ShellTool(),
//       new DuckDuckGoSearch(),
//       {
//         name: 'ReadFile',
//         description: 'Read file content by path',
//         func: async (input: string) => {
//           try {
//             return fs.readFileSync(input, 'utf-8');
//           } catch (e) {
//             return `Error reading file: ${e}`;
//           }
//         },
//       },
//       {
//         name: 'WriteFile',
//         description: 'Write content to file (format: path|content)',
//         func: async (input: string) => {
//           const [filePath, content] = input.split('|');
//           if (!filePath || !content) return 'Invalid format';
//           try {
//             fs.writeFileSync(filePath, content);
//             return 'File written';
//           } catch (e) {
//             return `Error writing file: ${e}`;
//           }
//         },
//       },
//       {
//         name: 'AppendFile',
//         description: 'Append content to file (format: path|content)',
//         func: async (input: string) => {
//           const [filePath, content] = input.split('|');
//           if (!filePath || !content) return 'Invalid format';
//           try {
//             fs.appendFileSync(filePath, content);
//             return 'Content appended';
//           } catch (e) {
//             return `Error appending file: ${e}`;
//           }
//         },
//       },
//       {
//         name: 'MemoryStore',
//         description: 'Store key|value in memory',
//         func: async (input: string) => {
//           const [key, value] = input.split('|');
//           if (!key || !value) return 'Invalid format';
//           this.memory[key] = value;
//           return `Stored: ${key}`;
//         },
//       },
//       {
//         name: 'MemoryRetrieve',
//         description: 'Retrieve value by key from memory',
//         func: async (input: string) => this.memory[input] || 'Not found',
//       },
//       {
//         name: 'TodoAdd',
//         description: 'Add task to todo list',
//         func: async (task: string) => {
//           this.todoList.push({ task, completed: false, created: new Date() });
//           return 'Task added';
//         },
//       },
//       {
//         name: 'TodoComplete',
//         description: 'Complete task by index',
//         func: async (input: string) => {
//           const index = parseInt(input);
//           if (isNaN(index) || index < 0 || index >= this.todoList.length) return 'Invalid index';
//           this.todoList[index].completed = true;
//           this.todoList[index].completedAt = new Date();
//           return `Task ${index} marked completed.`;
//         },
//       },
//       {
//         name: 'TodoShow',
//         description: 'Show all todo items',
//         func: async () =>
//           this.todoList
//             .map((item, i) => `${i}. ${item.completed ? '✓' : '○'} ${item.task}`)
//             .join('\n'),
//       },
//     ];
//   }

//   public async run(task: string, projectId?: string, sandboxUrl: string = ''): Promise<string> {
//     const prompt = this.buildPrompt(task);
//     const result = await this.agent.run(prompt);

//     await this.saveResult({
//       projectId: projectId || 'default-project',
//       content: result,
//       role: 'assistant',
//       type: 'RESULT',
//       sandboxUrl,
//       files: {},
//       title: 'Generated Fragment',
//     });

//     return result;
//   }

//   private buildPrompt(task: string): string {
//     return `
// You are an autonomous AI agent. Complete this task: ${task}

// TOOLS:
// - PythonREPL
// - ShellTool
// - WebSearch
// - ReadFile
// - WriteFile
// - AppendFile
// - MemoryStore
// - MemoryRetrieve
// - TodoAdd
// - TodoComplete
// - TodoShow

// RULES:
// - Be autonomous
// - Handle errors
// - Use tools wisely
// - Break work into steps
// - Show todo list often
// - Think before you act
// - Save and retry on failure

// BEGIN TASK NOW:`;
//   }

//   private async saveResult({
//     projectId,
//     content,
//     role,
//     type,
//     sandboxUrl,
//     files,
//     title,
//   }: {
//     projectId: string;
//     content: string;
//     role: 'user' | 'assistant';
//     type: 'RESULT' | 'ERROR';
//     sandboxUrl: string;
//     files: Record<string, string>;
//     title: string;
//   }) {
//     return await prisma.message.create({
//       data: {
//         projectId,
//         content,
//         role,
//         type,
//         fragment: {
//           create: {
//             sandboxUrl,
//             title,
//             files,
//           },
//         },
//       },
//     });
//   }
// }
