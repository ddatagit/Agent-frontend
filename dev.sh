#!/bin/bash

# Exit immediately on error
set -e

# Optional: Load environment variables from .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Start Inngest CLI in background
echo "🚀 Starting Inngest Dev Server..."
npx inngest-cli dev &
INNGEST_PID=$!

# Ensure Inngest is stopped when the script exits
trap "echo '🛑 Stopping Inngest...'; kill $INNGEST_PID" EXIT

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Push Prisma schema to DB
echo "🗂️  Syncing Prisma schema to DB..."
npx prisma db push

# Start Next.js dev server
echo "⚡ Starting Next.js..."
npx next dev
