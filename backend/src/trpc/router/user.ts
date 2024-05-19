import { Prisma, Student } from "@prisma/client"
import { z } from "zod"



import { publicProcedure, router } from "../index"
import { db } from "../../lib/auth"

import { studentRouter } from "./student"



export const userRouter = router({
  student: studentRouter,
  // teacher: teacherRouter,
  // admin: adminRouter,
})

