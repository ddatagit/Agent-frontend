import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Buffer } from "buffer";

export async function POST(req: NextRequest) {
  try {
    const { projectId, repo, rootDir = "app", githubUsername, githubToken } = await req.json();

    const BRANCH = "main";

    if (!githubToken || !githubUsername) {
      return NextResponse.json(
        { error: "Missing GitHub username or token." },
        { status: 400 }
      );
    }

    const fragment = await prisma.fragment.findFirst({
      where: { message: { projectId } },
      orderBy: { message: { createdAt: "desc" } },
    });

    if (!fragment || !fragment.files) {
      return NextResponse.json({ error: "No fragment files found." }, { status: 404 });
    }

    const files = fragment.files as Record<string, string>;
    const pushed: string[] = [];
    const failed: string[] = [];

    for (const [path, content] of Object.entries(files)) {
      const cleanPath = path.replace(/^\/+/, "");
      const githubPath = `${rootDir}/${cleanPath}`;
      const githubApi = `https://api.github.com/repos/${githubUsername}/${repo}/contents/${githubPath}`;

      let sha: string | undefined;

      try {
        const checkRes = await fetch(githubApi, {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github+json",
          },
        });

        if (checkRes.ok) {
          const checkData = await checkRes.json();
          sha = checkData.sha;
        }
      } catch (err) {
        console.error(`❌ Failed to check existing file: ${githubPath}`, err);
      }

      const putRes = await fetch(githubApi, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github+json",
        },
        body: JSON.stringify({
          message: `Push ${githubPath} via Student Loan App`,
          content: Buffer.from(content).toString("base64"),
          branch: BRANCH,
          ...(sha && { sha }),
        }),
      });

      if (putRes.ok) {
        pushed.push(githubPath);
      } else {
        const err = await putRes.json();
        console.error(`❌ Failed to push ${githubPath}:`, err.message);
        failed.push(`${githubPath}: ${err.message}`);
      }
    }

    return NextResponse.json({ pushed, failed });
  } catch (err: any) {
    console.error("❌ Internal Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
