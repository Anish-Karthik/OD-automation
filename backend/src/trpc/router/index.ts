// import { z } from "zod";
import { publicProcedure, router } from "../index";
import { collegeRouter } from "./college";
import { departmentRouter } from "./department";

import { formRouter } from "./form";
import { requestRouter } from "./request";

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
  request: requestRouter,
  college: collegeRouter,
  department: departmentRouter,
});
