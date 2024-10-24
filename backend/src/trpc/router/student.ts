
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