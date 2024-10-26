import { Prisma, Teacher } from "@prisma/client";
import { z } from "zod";
import { db } from "../../lib/auth";
import { publicProcedure, router } from "../index";
import { teacherFormRouter } from "./teacher-form";

export const teacherRouter = router({
  form: teacherFormRouter,
  get: publicProcedure.input(z.string()).query(async ({ input: id }) => {
    return await db.teacher.findUnique({
      where: { id },
    });
  }),
  list: publicProcedure.query(async () => {
    const teachers: {
      id: string;
      name: string | null;
      email: string | null;
    }[] = (
      await db.teacher.findMany({
        select: {
          id: true,
          userId: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      })
    ).map((teacher) => ({
      id: teacher.id,
      userId: teacher.userId,
      name: teacher.user.name,
      email: teacher.user.email,
    }));
    return teachers;
  }),

  create: publicProcedure
    .input(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email address"),
      })
    )
    .mutation(async ({ input }) => {
      return await db.user.upsert({
        where: { email: input.email },
        update: {
          name: input.name,
        },
        create: {
          role: "TEACHER",
          email: input.email,
          name: input.name,
          username: input.email,
          teacher: {
            create: {},
          },
        },
      });
    }),
  
  createMany: publicProcedure
    .input(z.array(z.object({
      id: z.string().optional(),
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Invalid email address"),
    })))
    .mutation(async ({ input }) => {
      const upsertPromises = input.map((teacher) =>
        db.user.upsert({
          where: { email: teacher.email },
          update: {
            name: teacher.name,
          },
          create: {
            role: "TEACHER",
            email: teacher.email,
            name: teacher.name,
            username: teacher.email,
            teacher: {
              create: {},
            },
          },
        })
      );
      return await Promise.all(upsertPromises);
    }),
  
  delete: publicProcedure.input(z.string()).mutation(async ({ input: id }) => {
    const std = await db.student.delete({
      where: { id },
    });
    const user = await db.user.delete({
      where: { id: std.userId },
    });
  }),

  getFilteredRequests: publicProcedure
    .input(
      z.object({
        filters: z.custom<Partial<Teacher>>().optional(),
      })
    )
    .query(async ({ input: { filters } }) => {
      const where: Prisma.StudentWhereInput = {};

      return await db.teacher.findMany({});
    }),
});
