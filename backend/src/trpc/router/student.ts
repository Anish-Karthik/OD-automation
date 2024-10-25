import { Prisma, Student } from "@prisma/client";
import { z } from "zod";
import { db } from "../../lib/auth";
import { publicProcedure, router } from "../index";
import { studentFormRouter } from "./student-form";

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
    .input(
      z.object({
        rollno: z.number(),
        regNo: z.string().min(1, "Registration number is required"),
        name: z.string().min(1, "Name is required"),
        year: z.number().min(1).max(5),
        section: z.string().min(1, "Section is required"),
        semester: z.number().min(1).max(10),
        batch: z.string().nullable(),
        email: z.string().email().nullable(),
        departmentId: z.string().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      return await db.user.create({
        data: {
          role: "STUDENT",
          email: input.email,
          name: input.name,
          username: input.email,
          student: {
            create: {
              ...input,
              departmentId: input.departmentId,
            },
          },
        },
      });
    }),
  
  createMany: publicProcedure
    .input(
      z.array(
        z.object({
          rollno: z.number(),
          regNo: z.string().min(1, "Registration number is required"),
          name: z.string().min(1, "Name is required"),
          year: z.number().min(1).max(5),
          section: z.string().min(1, "Section is required"),
          semester: z.number().min(1).max(10),
          batch: z.string().nullable(),
          email: z.string().email().nullable(),
          departmentId: z.string().nullable(),
        })
      )
    )
    .mutation(async ({ input }) => {
      const studentsCreatePromises = input.map((student) => 
        db.user.create({
          data: {
            role: "STUDENT",
            email: student.email,
            name: student.name,
            username: student.email,
            student: {
              create: {
                ...student,
                departmentId: student.departmentId,
              },
            },
          },
        })
      );
      return await Promise.all(studentsCreatePromises);
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
