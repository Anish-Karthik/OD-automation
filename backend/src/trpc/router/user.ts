import { z } from "zod";
import { db } from "../../lib/auth";
import { adminProcedure, router } from "../index";

import { studentRouter } from "./student";
import { teacherRouter } from "./teacher";


export const userRouter = router({
  student: studentRouter,
  teacher: teacherRouter,
  // admin: adminRouter,

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      console.log(input, "input", input.id);
      try {
        const user = await db.user.delete({
          where: {
            id: input.id,
          },
        });
        return user;
      } catch (error) {
        console.log(error);
        return error;
      }
    }),
});
