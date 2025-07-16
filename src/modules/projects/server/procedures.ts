import { prisma } from "@/lib/db";
import { inngest } from "@/inngest/client";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { MessageRole } from "@/generated/prisma";

export const projectsRouter = createTRPCRouter({
  // Get a single project by ID
  getOne: baseProcedure
    .input(
      z.object({
        id: z.string().min(1, { message: "Id is required" }),
      })
    )
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

  // Create a new project with first message and trigger Inngest
  create: baseProcedure
    .input(
      z.object({
        value: z
          .string()
          .min(1, { message: "Prompt or value is required" })
          .max(10000, { message: "Prompt or value is required" }),
      })
    )
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

        await inngest.send({
          name: "code-agent/run",
          data: {
            value: input.value,
            projectId: createdProject.id,
          },
        });

        console.log("✅ Inngest event sent");
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

  // ✅ Delete all projects
  deleteAll: baseProcedure.mutation(async () => {
    await prisma.project.deleteMany({});
    return { success: true };
  }),


deleteOne: baseProcedure
  .input(z.object({ id: z.string().min(1) }))
  .mutation(async ({ input }) => {
    await prisma.project.delete({ where: { id: input.id } });
    return { success: true };
  }),

rename: baseProcedure
  .input(z.object({ id: z.string().min(1), name: z.string().min(1) }))
  .mutation(async ({ input }) => {
    return await prisma.project.update({
      where: { id: input.id },
      data: { name: input.name },
    });
  }),

});
