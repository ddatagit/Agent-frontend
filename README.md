# Lovable AI – Sandbox App

A full-stack AI-powered app using **Next.js**, **Prisma**, **Inngest**, and **E2B**. Users can generate and submit sandbox data via form and preview it dynamically.


## Services

| Service | Use                                  |
| ------- | ------------------------------------ |
| Neon    | PostgreSQL DB (Cloud)                |
| Inngest | Event orchestration (localhost:8288) |
| Railway | API deployment                       |


## Project Structure

```
/src              → App logic
/prisma/schema    → DB models
/dev.sh           → Local dev runner
/docker-compose   → Docker setup
```

## Build With

* Next.js 15 App Router
* Prisma + Neon DB
* Inngest CLI
* E2B sandbox
* Tailwind + Shadcn UI

# Quick Start

Main app:
```bash
 http://localhost:3000
```

Log ai agent process
```bash
http://localhost:8288/runs
```

# 1 create new .env or .env.docker, copy and paste this (Paste the content from the link, NOT the link itself ( ͠° ͟ʖ ͡° )). If you cannot open the link, sorry - you don't have authorization to use it ( •̀ᴗ•́ ).

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
dev.sh will starts Prisma, Inngest Dev Server, and the app.

### Option 2: Docker


```bash
docker compose --env-file .env.docker up --build
```

Runs the app and tools inside a Docker container.
