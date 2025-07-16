import { prisma } from "@/lib/db";
import { inngest } from "@/inngest/client";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { z } from "zod";
import { MessageRole } from "@/generated/prisma";

export const messagesRouter = createTRPCRouter({
  // ✅ getMany: รองรับ undefined input
  getMany: baseProcedure
      .input(
      z.object({
        projectId: z.string().min(1, {message: "Project ID is required"}),
      }),
    )
    .query(async ({input}) => {
      const messages = await prisma.message.findMany({
        where: {
          projectId: input.projectId,
        },
        include: {
          fragment: true,
        },
        orderBy: [{ updatedAt: "asc" }],
      });
      return messages;
    }),

  // ✅ create: มี validation และ log
  create: baseProcedure
    .input(
      z.object({
        value: z.string()
          .min(1, { message: "Prompt or valu is required" })
          .max(10000, {message: "Prompt or value is required"}),
        projectId: z.string().min(1, {message: "Project ID is required"}),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        console.log("✅ Creating message with:", input.value);

        const createdMessage = await prisma.message.create({
          data: {
            projectId: input.projectId,
            content: input.value,
            role: MessageRole.USER,   
            type: "RESULT",  
          },
        });

        // 👇 หาก Inngest มีปัญหา ให้ comment ชั่วคราว
        await inngest.send({
          name: "code-agent/run",
          data: {
            value: input.value,
            projectId: input.projectId,
          },
        });

        console.log("✅ Inngest event sent");
        return createdMessage;

      } catch (err: any) {
        console.error("❌ Error in create mutation:", err);
        throw err;
      }
    }),
});
