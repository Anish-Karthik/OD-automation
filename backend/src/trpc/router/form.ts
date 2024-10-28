import z from "zod";
import { db } from "../../lib/auth";
import { protectedProcedure, router } from "../index";

export const formRouter = router({
  get: protectedProcedure.input(z.string()).query(async ({ input: id, ctx }) => {
    if (ctx.user?.id !== id) {
      throw new Error("Unauthorized");
    }
    return await db.form.findUnique({
      where: { id },
      include: {
        requests: true,
      }
    })
  }),
});
