import { createAgent, openai, createTool, createNetwork, type Tool, createState, type Message} from "@inngest/agent-kit";
import { inngest } from "./client";
import { Result, Sandbox } from "@e2b/code-interpreter";
import { getSandbox } from "./utils";
import { z } from "zod";
import { FRAGMENT_TITLE_PROMPT, PROMPT, RESPONSE_PROMPT, PROMPT_HOST_VERTIFY  } from "../../prompt";
import { lastAssistantTextMessageContent } from "./utils"; 
import { prisma } from "@/lib/db";


// -------------------- E2B TOOL: File System APIs --------------------
// 📟 1. Terminal Commands
// - Run bash/zsh commands inside the sandbox (e.g., npm install, node app.js, ls, cat file.ts)
// - Capture stdout, stderr streams, Run scripts or Docker builds (e.g., /compile_page.sh)
// 📁 2. File System APIs, Read/write/delete any file inside the sandbox
// - Create entire projects from templates (like next.js, react, python, etc.)
// - Modify code via agent tools (i.e., updating a specific file line or content programmatically)
// 🌐 3. Web Server Hosting (Preview URLs), Serve apps inside the sandbox on a public URL (sandbox.getHost(port))
// Useful for previewing generated React, Next.js, or Flask apps in real-time
// 📦 4. Language Model Agents (via Inngest + AgentKit), Let GPT-4o or similar models:
// - Edit or create code (create/update files)
// - Execute commands (run tests, start app)
// - Analyze output or logs
// - Chain tools like terminal, readFiles, writeFiles as part of multi-step workflows
// 📚 5. Use with Inngest + Functions, Trigger sandbox actions based on events like:
// - HTTP webhook
// - Scheduled cron job
// - User interaction in frontend (e.g. “Build my AI” button)

//  interface AgentState
interface AgentState{
  summary: string;
  files: { [path:string ]: string };
};

// -------------------- TOOL: terminal --------------------
function createTerminalTool(sandboxId: string) {
  return createTool({
    name: "terminal",
    description: "Run a terminal command in the sandbox",
    parameters: z.object({
      command: z.string(),
    }),
    handler: async ({ command }, { step }) => {
      return await step?.run("terminal", async () => {
        const buffers = { stdout: "", stderr: "" };

        try {
          const sandbox = await getSandbox(sandboxId);
          await sandbox.commands.run(command, {
            onStdout: (data: string) => {
              buffers.stdout += data;
            },
            onStderr: (data: string) => {
              buffers.stderr += data;
            },
          });

          return { stdout: buffers.stdout, stderr: buffers.stderr };
        } catch (e) {
          return {
            error: e instanceof Error ? e.message : String(e),
            stdout: buffers.stdout,
            stderr: buffers.stderr,
          };
        }
      });
    },
  });
}

// -------------------- TOOL: createOrUpdateFiles --------------------
function createFileTool(sandboxId: string) {
  return createTool({
    name: "createOrUpdateFiles",
    description: "Create or update files in the sandbox",
    parameters: z.object({
      files: z.array(
        z.object({
          path: z.string(),
          content: z.string(),
        })
      ),
    }),
    handler: async ({ files }, { step, network }: Tool.Options<AgentState>)=> {
      const newFiles = await step?.run("createOrUpdateFiles", async () => {
        try {
          const updatedFiles = network.state.data.files || {};
          const sandbox = await getSandbox(sandboxId); // Ensure sandboxId is in scope

          for (const file of files) {
            await sandbox.files.write(file.path, file.content);
            updatedFiles[file.path] = file.content;
          }

          return updatedFiles;
        } catch (e) {
          return { error: "Error: " + (e instanceof Error ? e.message : String(e)) };
        }
      });

      // Save to state if no error
      if (newFiles && typeof newFiles === "object" && !("error" in newFiles)) {
        network.state.data.files = newFiles;
      }

      return newFiles;
    },
  });
}

// -------------------- TOOL: readFiles --------------------
function createReadFileTool(sandboxId: string) {
  return createTool({
    name: "readFiles",
    description: "Read files from the sandbox",
    parameters: z.object({
      files: z.array(z.string()),
    }),
    handler: async ({ files }, { step, network }) => {
      const fileContents = await step?.run("readFiles", async () => {
        try {
          const sandbox = await getSandbox(sandboxId);
          const contents: Record<string, string> = {};

          for (const file of files) {
            const content = await sandbox.files.read(file);
            contents[file] = content;
          }

          return contents;
        } catch (e) {
          return { error: "Error: " + (e instanceof Error ? e.message : String(e)) };
        }
      });

      // Store in state if successful
      if (fileContents && typeof fileContents === "object" && !("error" in fileContents)) {
        network.state.data.readFiles = fileContents;
      }

      return fileContents;
    },
  });
}

// -------------------- RETRY HELPER --------------------
// -------------------- RETRY CONFIG TYPE --------------------
interface RetryConfig {
  maxRetries: number;               // for non-rate-limit errors like payload-too-large
  initialWaitMs: number;            // initial base wait time (ms)
  infiniteRateLimit: boolean;       // keep retrying rate limits forever
  maxRateLimitWait: number;         // maximum wait per retry (in seconds)
  exponentialBackoffCap: number;    // cap for exponential backoff
  logger?: (msg: string) => Promise<void> | void; // for logging to Inngest step.log()
}

// -------------------- THROTTLE RUN --------------------
async function throttleRun<T>(
  label: string,
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const {
    maxRetries = 5,
    initialWaitMs = 8000,
    infiniteRateLimit = true,
    maxRateLimitWait = 600,
    exponentialBackoffCap = 10,
    logger = async () => {},
  } = config;

  let generalRetryAttempt = 0;
  let rateLimitAttempt = 0;
  let consecutiveRateLimits = 0;

  while (true) {
    try {
      const result = await fn();
      // ✅ Success logging
      await logger(`[${label}] ✅ Success after ${rateLimitAttempt} rate limit retries and ${generalRetryAttempt} general retries.`);
      consecutiveRateLimits = 0;
      return result;
    } catch (err: any) {
      const data = err?.response?.data?.error || {};
      const code = data?.code as string | undefined;
      const type = data?.type as string | undefined;
      const rawMessage = data?.message;
      const message = typeof rawMessage === "string" ? rawMessage : "";

      const retryAfterMatch = message.match(/try again in ([\d.]+)s/i);
      const retryAfterSec = retryAfterMatch ? parseFloat(retryAfterMatch[1]) : undefined;

      const isTokenLimit = type === "tokens";
      const isRateLimit = code === "rate_limit_exceeded";
      const isTooLarge = message.includes("Requested") && message.includes("Limit");

      if (isTokenLimit && infiniteRateLimit) {
        rateLimitAttempt++;
        const waitSec = retryAfterSec ?? (initialWaitMs / 1000) * rateLimitAttempt;
        await logger(`[${label}] TPM limit hit. Retrying in ${waitSec.toFixed(1)}s (attempt ${rateLimitAttempt})…`);
        await new Promise((r) => setTimeout(r, waitSec * 1000));
        continue;
      }

      if (isRateLimit && infiniteRateLimit) {
        rateLimitAttempt++;
        consecutiveRateLimits++;
        const backoffMultiplier = Math.min(consecutiveRateLimits, exponentialBackoffCap);
        let waitSec = retryAfterSec ?? Math.min(maxRateLimitWait, (initialWaitMs / 1000) * backoffMultiplier);
        waitSec += Math.random() * 0.2 * waitSec;
        await logger(`[${label}] Rate limited. Retrying in ${waitSec.toFixed(1)}s (attempt ${rateLimitAttempt})…`);
        await new Promise((r) => setTimeout(r, waitSec * 1000));
        continue;
      }

      if (isTooLarge) {
        generalRetryAttempt++;
        if (generalRetryAttempt >= maxRetries) {
          throw new Error(`[${label}] Payload too large after ${maxRetries} retries`);
        }
        const waitSec = retryAfterSec ?? (initialWaitMs / 1000) * generalRetryAttempt;
        await logger(`[${label}] Payload too large. Retrying in ${waitSec}s (attempt ${generalRetryAttempt})…`);
        await new Promise((r) => setTimeout(r, waitSec * 1000));
        continue;
      }

      throw err;
    }
  }
}


// -------------------- MAIN FUNCTION --------------------
export const codeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" },
  async ({ event, step, }) => {

    // Step 1: Create sandbox
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await throttleRun("create-sandbox", () =>
        Sandbox.create("my-lovable-ai-test"),
        {
          logger: async (msg) => console.log(`[create-sandbox] ${msg}`),
        }
      );

      await sandbox.setTimeout(30 * 60 * 1000);
      return sandbox.sandboxId;
    });

    // Step 2: Loading previous
    const previousMessages = await step.run("get-previous-messages", async () => {
      const messages = await prisma.message.findMany({
        where: {
          projectId: event.data.projectId,
        },
        orderBy: {
          createdAt: "desc", // TODO: change to "asc" if does not understand what is the lastest message
          
        },
      });

      const formattedMessages = messages.map((message) => ({
        type: "text",
        role: message.role === "ASSISTANT" ? "assistant" : "user",
        content: message.content,
      }));
      return formattedMessages as Message[]; 
    });
      const state = createState<AgentState>(
      {
        summary: "",
        files: {},
      },
      {
        messages: previousMessages,
      },
      );

    // Step 3: Create agent with tools
    const agent = createAgent<AgentState>({
      name: "code-agent",
      description: "An expert coding agent",
      system: PROMPT,
      model: openai({ model: "gpt-4.1", defaultParameters: { temperature: 0.1 } }), //// Low temperature (0.1) = focused, reliable, less random output (good for code/data tasks)
      tools: [
        createTerminalTool(sandboxId),
        createFileTool(sandboxId),
        createReadFileTool(sandboxId),
      ],
    });

    // Step 4: Create network
    const network = createNetwork<AgentState>({
      name: "coding-agent-network",
      agents: [agent],
      maxIter: 15,
      defaultState: state,
      router: async ({ network, lastResult }) => {
        // // local summary no need due to having the agentstate 
        // const summary= network.state.data.summary;
    
        if (!network.state.data.summary && lastResult?.output) {
          const fallback = lastAssistantTextMessageContent(lastResult);
          if (fallback) {
            network.state.data.summary = fallback;
          }
        }
        if (network.state.data.summary) {
          return undefined;
        }
        return agent;
      },
    });

    // Run once for state initialization
    const result = await throttleRun(
      "initial-network-run",
      () => network.run(event.data.value, { state }),
      { logger: async (msg) => console.log(msg) }
    );

 
    // Run once for output generation
    const runResult = await throttleRun(
      "final-network-run",
      () => network.run(`Write the following snippet: ${event.data.value}`),
      { logger: async (msg) => console.log(msg) }
    );


    // step 5.1 gen title and better response
    const fragmentTitleGenerator = createAgent({
      name: "fragmentTittle-title-generator",
      description: "A fragmeny title generator",
      system: FRAGMENT_TITLE_PROMPT,
      model: openai({ model: "gpt-4o", defaultParameters: { temperature: 0.1 } }), //// Low temperature (0.1) = focused, reliable, less random output (good for code/data tasks)
    })

    const responseGenerator = createAgent({
      name: "response-geneator",
      description: "A response generator",
      system: RESPONSE_PROMPT,
      model: openai({ model: "gpt-4o", defaultParameters: { temperature: 0.1 } }), //// Low temperature (0.1) = focused, reliable, less random output (good for code/data tasks)
    })

    const { output: fragmentTitleOutput } = await throttleRun(
      "fragment-title-run",
      () => fragmentTitleGenerator.run(result.state.data.summary),
      { logger: async (msg) => console.log(msg) }
    );

    const { output: responseOutput } = await throttleRun(
      "response-generator-run",
      () => responseGenerator.run(result.state.data.summary),
      { logger: async (msg) => console.log(msg) }
    );

  
   const generateFragmentTitle = () => {
    if (fragmentTitleOutput[0].type !== "text") {
      return "Fragment";
    }

    if (Array.isArray(fragmentTitleOutput[0].content)) {
      return fragmentTitleOutput[0].content.map((txt) => txt).join("");
    } else {
      return fragmentTitleOutput[0].content;
    }
   };

    const generateReponse = () => {
    if (responseOutput[0].type !== "text") {
      return "Here you go";
    }
    if (Array.isArray(responseOutput[0].content)) {
      return responseOutput[0].content.map((txt) => txt).join("");
    } else {
      return responseOutput[0].content;
    }}

    // Step 6: Fallback summary handling with introspection
    let summary = runResult.state.data.summary;
    if (!summary || typeof summary !== "string") {
        // @ts-ignore: We're forcing this because ._history is private in v0.9.0
        const history = runResult._history as any[] | undefined;

        const lastAssistant = history
          ?.reverse()
          ?.find((entry) => entry?.output && Array.isArray(entry.output))
          ?.output
          ?.findLast((msg: any) => msg.role === "assistant");

        if (lastAssistant?.content) {
          summary =
            typeof lastAssistant.content === "string"
              ? lastAssistant.content
              : lastAssistant.content.map((c: any) => c.text).join("");

          runResult.state.data.summary = summary;
        }
      }

        // Still not found? Fail.
        if (!summary || typeof summary !== "string" || summary.trim() === "") {
          console.error("DEBUG: runResult.state =", runResult.state);
          // @ts-ignore
          console.error("DEBUG: runResult._history =", runResult._history);
          throw new Error("No assistant output found—cannot proceed without a summary.");
        }

        // not result data
        const isError = 
          !runResult.state.data.summary ||
          Object.keys(runResult.state.data.files || {}).length === 0;

    // Step 7: Obtain public sandbox URL
    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sb = await throttleRun("get-sandbox", () => getSandbox(sandboxId));
      return `https://${sb.getHost(3000)}`;
    });

    // Step 8: Persist via Prisma
    // if isError
    await step.run("save-result", async () => {
      if (isError) {
        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content: "Something went wrong. Please try again.",
            role: "ASSISTANT",
            type: "ERROR",
            fragment: {
              create: {
                sandboxUrl, // optional: helpful for debugging
                title: generateFragmentTitle(),
                files: {},  // you can leave it empty or omit this if Prisma allows
              },
            },
          },
        });
      }

      // return Result
      return await prisma.message.create({
        data: {
          projectId: event.data.projectId,
          content: generateReponse(),
          role: "ASSISTANT",
          type: "RESULT",
          fragment: {
            create: {
              sandboxUrl,
              title: generateFragmentTitle(),
              files: runResult.state.data.files,
            },
          },
        },
      });
    });
    

    // Step 9: Return payload
    return {
      url: sandboxUrl,
      title: "Fragment",
      files: runResult.state.data.files,
      summary,
    };
    
    }
  );


  