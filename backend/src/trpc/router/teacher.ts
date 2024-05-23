import { z } from "zod";
import { publicProcedure, router } from "../index";
import { db } from "../../lib/auth";
import { studentFormRouter } from "./student-form";
import { Prisma, Student, Teacher } from "@prisma/client";
import { teacherFormRouter } from "./teacher-form";

export const teacherRouter = router({
  form: teacherFormRouter,
  get: publicProcedure.input(z.string()).query(async ({ input: id }) => {
    return await db.teacher.findUnique({
      where: { id },
    });
  }),
  list: publicProcedure.query(async () => {
    return await db.teacher.findMany({});
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
