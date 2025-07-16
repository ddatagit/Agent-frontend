import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.$queryRaw`SELECT NOW()`;
    console.log("✅ Connected to PostgreSQL:", result);
  } catch (err) {
    console.error("❌ Failed to connect:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
