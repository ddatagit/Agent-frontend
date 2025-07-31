import { prisma } from "@/lib/db";
import { inngest } from "@/inngest/client";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { z } from "zod";
import { MessageRole } from "@/generated/prisma";

// Centralized tool-event mapping
const toolEvents = {
  "Daily Tasks": "daily-agent/run",
  "Web Generator": "code-agent/run",
  "Deep Search": "search-agent/run",
} as const;

const ToolEnum = z.enum(Object.keys(toolEvents) as [keyof typeof toolEvents]);

export const messagesRouter = createTRPCRouter({
  getMany: baseProcedure
    .input(z.object({ projectId: z.string().min(1) }))
    .query(async ({ input }) => {
      return prisma.message.findMany({
        where: { projectId: input.projectId },
        include: { fragment: true },
        orderBy: [{ updatedAt: "asc" }],
      });
    }),

  create: baseProcedure
    .input(z.object({
      value: z.string().min(1).max(10000),
      projectId: z.string().min(1),
      tool: ToolEnum,
    }))
    .mutation(async ({ input }) => {
      const created = await prisma.message.create({
        data: {
          content: input.value,
          projectId: input.projectId,
          role: MessageRole.USER,
          type: "RESULT",
        },
      });

      const eventName = toolEvents[input.tool];
      await inngest.send({
        name: eventName,
        data: {
          value: input.value,
          projectId: input.projectId,
        },
      });
      console.log(`✅ Inngest event "${eventName}" sent`);

      return created;
    }),
});
