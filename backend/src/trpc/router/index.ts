// import { z } from "zod";
import { publicProcedure, router } from "../index";
import { collegeRouter } from "./college";
import { departmentRouter } from "./department";

import { formRouter } from "./form";
import { subjectRouter } from "./subject";

import { userRouter } from "./user";

export const appRouter = router({
  list: publicProcedure.query(async () => {
    return [1, 2, 3];
  }),
  hello: publicProcedure.query(async () => {
    return "world";
  }),
  user: userRouter,
  form: formRouter,
  college: collegeRouter,
  department: departmentRouter,
  subject: subjectRouter,
});
