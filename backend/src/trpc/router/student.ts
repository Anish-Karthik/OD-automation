import { Prisma, Student } from "@prisma/client";
import { z } from "zod";
import { db } from "../../lib/auth";
import { adminProcedure, router } from "../index";
import { studentFormRouter } from "./student-form";
import { password } from "bun";
import generatePassword from "generate-password";
import { Argon2id } from "oslo/password";

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
  const randomPassword = generatePassword.generate({
    length: 12,
    numbers: true,
    symbols: true,
    uppercase: true,
    lowercase: true,
  });

  const hashedPassword = await new Argon2id().hash(randomPassword);

  const data: any = {
    role: "STUDENT",
    email: student.email,
    name: student.name,
    username: student.email,
    password: hashedPassword,
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
  get: adminProcedure.input(z.string()).query(async ({ input: id }) => {
    return await db.student.findUnique({
      where: { id },
      include: { department: true },
    });
  }),
  list: adminProcedure.query(async () => {
    return await db.student.findMany({
      include: { department: true },
    });
  }),

  incrementSemester: adminProcedure
    .input(
      z.object({
        batch: z.string().min(1, "Batch is required"),
        maxSemester: z
          .string()
          .min(1, "Max semester is required")
          .refine((v) => {
            return !isNaN(parseInt(v)) && parseInt(v) <= 12;
          }),
      })
    )
    .mutation(async ({ input }) => {
      const students = await db.student.findMany({
        where: {
          batch: input.batch,
          semester: {
            lte: parseInt(input.maxSemester),
          },
        },
      });

      // increment year of students if current semester is even
      const year = students[0].year + (students[0].semester % 2 === 0 ? 1 : 0);

      const studentsUpdatePromises = students.map(async (student) => {
        return await db.student.update({
          where: { id: student.id },
          data: {
            semester: student.semester + 1,
            year,
          },
        });
      });

      return await Promise.all(studentsUpdatePromises);
    }),

  create: adminProcedure
    .input(studentInputSchema)
    .mutation(async ({ input }) => {
      return await upsertStudent(input);
    }),

  createMany: adminProcedure
    .input(z.array(studentInputSchema))
    .mutation(async ({ input }) => {
      const studentsCreatePromises = input.map(upsertStudent);
      return await Promise.all(studentsCreatePromises);
    }),

  getFilteredRequests: adminProcedure
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
