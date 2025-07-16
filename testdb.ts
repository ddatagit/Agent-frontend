// app/api/mock/route.ts
import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";

const client = new MongoClient(process.env.MONGODB_URI!);

export async function GET() {
  await client.connect();
  const db = client.db("ai-web-builder");
  const data = await db.collection("mock_web_data").find({}).toArray();
  return NextResponse.json(data);
}
