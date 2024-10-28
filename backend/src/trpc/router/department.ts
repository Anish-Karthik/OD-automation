import { z } from "zod";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../index";
import { db } from "../../lib/auth";

export const departmentRouter = router({
  getAll: protectedProcedure.query(async ({}) => {
    return await db.department.findMany();
  }),
  create: adminProcedure
    .input(
      z.object({
        name: z.string(),
        code: z.string(),
      })
    )
    .mutation(async ({ input: { name, code } }) => {
      return await db.department.create({ data: { name, code } });
    }),
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().nullish(),
        code: z.string().nullish(),
      })
    )
    .mutation(async ({ input: { id, name, code } }) => {
      let data = {};
      if (name) data = { ...data, name };
      if (code) data = { ...data, code };
      return await db.department.update({ where: { id }, data: data });
    }),
});
