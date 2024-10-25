
import { z } from 'zod'
import { publicProcedure, router } from '../index'
import { db } from '../../lib/auth'
import { studentFormRouter } from './student-form'
import { Prisma, Student } from '@prisma/client'

export const studentRouter = router({

  form: studentFormRouter,
  get: publicProcedure.input(z.string()).query(async ({ input: id }) => {
    return await db.student.findUnique({
      where: { id },
      include: { department: true },
    })
  }),
  list: publicProcedure.query(async () => {
    return await db.student.findMany({
      include: { department: true },
    })
  }),

  
  create: publicProcedure
  .input(
    z.object({
      id: z.string().optional(), 
      regNo: z.string(),
      rollno: z.number(),
      name: z.string(),
      year: z.number(),
      section: z.string(),
      semester: z.number(),
      vertical: z.string().nullable(), 
      batch: z.string().nullable(),
      email: z.string().nullable(),
      userId: z.string(),
      tutorId: z.string().nullable().default(null),          // Ensure null default
      yearInChargeId: z.string().nullable().default(null),   // Ensure null default
      departmentId: z.string().nullable().default(null),     // Ensure null default
    })
  )
  .mutation(async ({ input }) => {
    return await db.student.create({
      data: {
        ...input, 
      },
    })
  }),


  listUserWithStudent: publicProcedure.query(async () => {
    return await db.user.findMany({
      where: { role: "STUDENT" },
      include: { student: true },
    })
  }
  ),

  
    
  createUserWithStudent: publicProcedure
    .input(
      z.object({
        name: z.string().nullable(), // User fields
        email: z.string().nullable(),
        username: z.string().nullable(),
        role: z.enum([ "ADMIN", "TEACHER", "STUDENT"]), // Adjust based on your roles
        password: z.string().nullable(),
        student: z.object({          // Student fields
          regNo: z.string(),
          rollno: z.number(),
          name: z.string(),
          year: z.number(),
          section: z.string(),
          semester: z.number(),
          vertical: z.string().nullable().optional(),
          batch: z.string().nullable().optional(),
          email: z.string().nullable(),
          tutorId: z.string().nullable().default(null),          // Ensure null default
          yearInChargeId: z.string().nullable().default(null),   // Ensure null default
          departmentId: z.string().nullable().default(null),     // Ensure null default
        }),
      })
    )
    .mutation(async ({ input }) => {
      const { student, ...userData } = input;

      return await db.user.create({
        data: {
          ...userData,
          // Create related student data
          student: {
            create: {
              ...student,  // Pass all student fields for creation
            },
          },
        },
      });
    }),
  
  
  updateUserWithStudent: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().nullable(), // User fields
        email: z.string().nullable(),
        username: z.string().nullable(),
        role: z.enum([ "ADMIN", "TEACHER", "STUDENT"]), // Adjust based on your roles
        password: z.string().nullable(),
        student: z.object({          // Student fields
          regNo: z.string(),
          rollno: z.number(),
          name: z.string(),
          year: z.number(),
          section: z.string(),
          semester: z.number(),
          vertical: z.string().nullable().optional(),
          batch: z.string().nullable().optional(),
          email: z.string().nullable(),
          tutorId: z.string().nullable().default(null),          // Ensure null default
          yearInChargeId: z.string().nullable().default(null),   // Ensure null default
          departmentId: z.string().nullable().default(null),     // Ensure null default
        }),
      })
  )
  .mutation(async ({ input }) => {
    const { id, student, ...userData } = input;

    return await db.user.update({
      where: { id },
      data: {
        ...userData,
        // Update related student data
        student: {
          update: {
            ...student,  // Pass all student
          },
        },
      },
    });
  }
  ),

  getFilteredRequests: publicProcedure
    .input(
      z.object({
        filters: z.custom<Partial<Student>>().optional(),
      })
    )
    .query(async ({ input: { filters } }) => {
      const where: Prisma.StudentWhereInput = {}

      if (filters) {
        if (filters.id) {
          where.id = filters.id
        }
        if (filters.name) {
          where.name = filters.name
        }
        if (filters.regNo) {
          where.regNo = filters.regNo
        }
        // Add more conditions for other filters
      }

      return await db.student.findMany({
        where,
        include: { department: true },
      })
    }),
})