import { Prisma, Student } from "@prisma/client";
import { z } from "zod";
import { db } from "../../lib/auth";
import { publicProcedure, router } from "../index";
import { studentFormRouter } from "./student-form";

const studentInputSchema = z.object({
  rollno: z.number(),
  regNo: z.string().min(1, "Registration number is required"),
  name: z.string().min(1, "Name is required"),
  year: z.number().min(1).max(5),
  section: z.string().min(1, "Section is required"),
  semester: z.number().min(1).max(10),
  batch: z.string().nullable(),
  email: z.string().email().nullable(),
  departmentId: z.string().nullable(),
});

const upsertStudent = async (student: z.infer<typeof studentInputSchema>) => {
  const data: any = {
    role: "STUDENT",
    email: student.email,
    name: student.name,
    username: student.email,
  };
  return await db.user.upsert({
    where: { email: student.email! },
    update: {
      ...data,
      student: {
        update: {
          ...student,
        },
      },
    },
    create: {
      ...data,
      student: {
        create: {
          ...student,
        },
      },
    },
  });
};

export const studentRouter = router({
  form: studentFormRouter,
  get: publicProcedure.input(z.string()).query(async ({ input: id }) => {
    return await db.student.findUnique({
      where: { id },
      include: { department: true },
    });
  }),
  list: publicProcedure.query(async () => {
    return await db.student.findMany({
      include: { department: true },
    });
  }),

  create: publicProcedure
    .input(studentInputSchema)
    .mutation(async ({ input }) => {
      return await upsertStudent(input);
    }),

  createMany: publicProcedure
    .input(z.array(studentInputSchema))
    .mutation(async ({ input }) => {
      const studentsCreatePromises = input.map(upsertStudent);
      return await Promise.all(studentsCreatePromises);
    }),

  delete: publicProcedure.input(z.string()).mutation(async ({ input: id }) => {
    const teacher = await db.teacher.delete({
      where: { id },
    });
    const user = await db.user.delete({
      where: { id: teacher.userId },
    });
  }),

  getFilteredRequests: publicProcedure
    .input(
      z.object({
        filters: z.custom<Partial<Student>>().optional(),
      })
    )
    .query(async ({ input: { filters } }) => {
      const where: Prisma.StudentWhereInput = {};

      if (filters) {
        if (filters.id) {
          where.id = filters.id;
        }
        if (filters.name) {
          where.name = filters.name;
        }
        if (filters.regNo) {
          where.regNo = filters.regNo;
        }
        // Add more conditions for other filters
      }

      return await db.student.findMany({
        where,
        include: { department: true },
      });
    }),
});
