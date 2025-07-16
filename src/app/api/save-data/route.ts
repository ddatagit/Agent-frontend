import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📥 Received from agent:", body);

    if (!body.projectId || !body.payload) {
      return NextResponse.json({ error: "Missing projectId or payload" }, { status: 400 });
    }

    const data = await prisma.outputData.create({
      data: {
        projectId: body.projectId,
        payload: body.payload,
      },
    });

    console.log("✅ Saved to outputData:", data);

    // ✅ IMPORTANT: return this structured response
    return NextResponse.json({
      success: true,
      id: data.id,
    });

  } catch (err) {
    console.error("❌ Error in /api/save-data:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
