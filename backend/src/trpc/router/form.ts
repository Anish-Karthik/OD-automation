import { publicProcedure, router } from "../index";
import { db } from "../../lib/auth";
import z from "zod"; 
import { Form } from "@prisma/client";

export const formRouter = router({
  get: publicProcedure.input(z.string()).query(async ({ input: id }) => {
    return await db.form.findUnique({
      where: { id },
      include: {
        requests: true,
      }
    })
  }),
  list: publicProcedure.query(async () => {
    return await db.form.findMany({
      include: {
        requests: true,
      }
    })
  }),
});
