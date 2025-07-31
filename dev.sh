#!/bin/bash

# Exit immediately on error
set -e

echo ""
echo "==============================="
echo "🚀  Lovable AI Dev Bootstrap"
echo "==============================="

# Load .env (only key=value, no export, no comments)
if [ -f .env ]; then
  echo "🔐 Loading environment variables from .env..."
  export $(grep -E '^[A-Za-z_][A-Za-z0-9_]*=' .env | xargs)
fi

# Start Inngest Dev Server in background
echo "📡 Starting Inngest Dev Server (localhost:8288)..."
npx inngest-cli dev &
INNGEST_PID=$!

# Ensure it shuts down cleanly
trap "echo '🛑 Stopping Inngest Dev Server...'; kill $INNGEST_PID" EXIT

# Wait briefly to ensure Inngest starts
sleep 1

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Sync Prisma schema to DB
echo "🗂️  Syncing Prisma schema to DB..."
npx prisma db push

# Start Next.js App
echo "⚡ Launching Next.js App (localhost:3000)..."
npx next dev
