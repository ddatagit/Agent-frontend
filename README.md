# Lovable AI – Full-Stack AI Sandbox App

An AI-powered full-stack app built with **Next.js**, **Prisma**, **Inngest**, **E2B**, and a custom Python agent using **LangChain**. Users can generate sandboxed code/data, preview results, and interact with autonomous AI agents.

## 🧱 Built With

- **Next.js 15** (App Router)
- **Prisma** + Neon PostgreSQL
- **Inngest CLI** (Event-driven orchestration)
- **E2B Sandboxes** (Code execution)
- **LangChain (Python)** + FastAPI
- **TailwindCSS** + Shadcn UI

## Services Used

| Service     | Use                                  |
|-------------|---------------------------------------|
| **Neon**    | Cloud PostgreSQL DB                   |
| **Inngest** | Serverless orchestration + background jobs |
| **E2B**     | Secure sandboxed code execution       |
| **FastAPI** | Python REST API wrapping LangChain agent |



## Project Structure

```
/src → App logic (Next.js + tRPC + Inngest)
/prisma/schema.prisma → Database models (Prisma)
/Agent-Python/ → Python LangChain agent (FastAPI)
/docker-compose.yml → Full-stack dev environment
/dev.sh → Local dev bootstrap script
```

## Build With

* Next.js 15 App Router
* Prisma + Neon DB
* Inngest CLI
* E2B sandbox
* Tailwind + Shadcn UI

```
# Quick Start

Main app:

 http://localhost:3000

Log ai agent process

http://localhost:8288/runs

python ai agent process server

http://localhost:8000/docs

# 1 create new .env or .env.docker, copy and paste this (Paste content in link, NOT paste this link ( ͠° ͟ʖ ͡° )) if cannot open the link, sorry you don't have authorization ( •̀ᴗ•́ )

https://docs.google.com/document/d/1nJDqi5JiPEhNa0Rxi7StyZ4ZfFpSAV-1ZIiFReG75DU/edit?tab=t.0


## or using your own .env Example

```env
DATABASE_URL="postgresql://<user>:<pass>@<neon-host>/<db>?sslmode=require"
OPENAI_API_KEY="sk-..."
E2B_API_KEY="e2b_..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Option 1: Local Dev

```bash
chmod +x dev.sh
./dev.sh
```

test python server:
```bash
curl -X POST http://localhost:8000/run-task \
  -H "Content-Type: application/json" \
  -d '{"task": "Summarize recent transcript files."}'
```

Starts Prisma, Inngest Dev Server, and the app.

### Option 2: Docker

http://localhost:8000/docs#/default/run_task_run_task_post

```bash
docker compose --env-file .env.docker up --build
```
Runs the app and tools inside a Docker container.

--- 
debug เฉยๆ


```bash
🧠 Inngest DeepsearchAgentFunction
    |
    |-> ⛓️ runPythonAgent(prompt: string)
            |
            |-> 🌐 POST to FastAPI /run-task
                    |
                    |-> 🐍 AgenticAI.run_autonomous_task()
```

for python ai agent:
```bash
docker build -t agentic-ai .

docker run -p 8000:8000 agentic-ai
```

main web:

http://localhost:3000

---

server:

FastAPI

http://localhost:3000

inngest

http://localhost:8288/runs


