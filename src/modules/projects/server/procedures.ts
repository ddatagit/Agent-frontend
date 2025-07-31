// src/modules/projects/server/procedures.ts

import { prisma } from "@/lib/db";
import { inngest } from "@/inngest/client";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { MessageRole } from "@/generated/prisma";

// Centralized tool-event mapping
const toolEvents = {
  "Daily Tasks": "daily-agent/run",
  "Web Generator": "code-agent/run",
  "Deep Search": "search-agent/run",
} as const;

const ToolEnum = z.enum(Object.keys(toolEvents) as [keyof typeof toolEvents]);

export const projectsRouter = createTRPCRouter({
  // Get a single project by ID
  getOne: baseProcedure
    .input(z.object({ id: z.string().min(1, { message: "Id is required" }) }))
    .query(async ({ input }) => {
      const existingProject = await prisma.project.findUnique({
        where: { id: input.id },
      });

      if (!existingProject) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      return existingProject;
    }),

  // Get all projects
  getMany: baseProcedure.query(async () => {
    return await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),

  // ✅ Create a new project with first message and selected tool
  create: baseProcedure
    .input(z.object({
      value: z.string().min(1).max(10000),
      tool: ToolEnum,
    }))
    .mutation(async ({ input }) => {
      try {
        console.log("Creating project and message with:", input.value);

        const slug = crypto.randomUUID().slice(0, 8);

        const createdProject = await prisma.project.create({
          data: {
            name: slug,
            messsages: {
              create: {
                content: input.value,
                role: MessageRole.USER,
                type: "RESULT",
              },
            },
          },
        });

        const eventName = toolEvents[input.tool];
        await inngest.send({
          name: eventName,
          data: {
            value: input.value,
            projectId: createdProject.id,
          },
        });

        console.log(`✅ Inngest event "${eventName}" sent`);
        return createdProject;
      } catch (err: any) {
        console.error("❌ Error in create mutation:", err);
        throw err;
      }
    }),

  // Create an empty project (for new session)
  createEmpty: baseProcedure
    .input(z.void())
    .mutation(async () => {
      const slug = crypto.randomUUID().slice(0, 8);
      const createdProject = await prisma.project.create({
        data: {
          name: `Untitled-${slug}`,
        },
      });

      return createdProject;
    }),

  // Delete all projects
  deleteAll: baseProcedure.mutation(async () => {
    await prisma.project.deleteMany({});
    return { success: true };
  }),

  // Delete one project
  deleteOne: baseProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      await prisma.project.delete({ where: { id: input.id } });
      return { success: true };
    }),

  // Rename project
  rename: baseProcedure
    .input(z.object({ id: z.string().min(1), name: z.string().min(1) }))
    .mutation(async ({ input }) => {
      return await prisma.project.update({
        where: { id: input.id },
        data: { name: input.name },
      });
    }),
});
