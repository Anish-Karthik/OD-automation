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
      name: teacher.user.name,
      email: teacher.user.email,
    }));
    return teachers;
  }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email address"),
      })
    )
    .mutation(async ({ input }) => {
      return await db.user.create({
        data: {
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
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Invalid email address"),
    })))
    .mutation(async ({ input }) => {
      return await db.user.createMany({
        data: input.map((teacher) => ({
          role: "TEACHER",
          email: teacher.email,
          name: teacher.name,
          username: teacher.email,
          teacher: {
            create: {},
          },
        })),
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
