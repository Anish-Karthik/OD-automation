import { z } from "zod";
import { publicProcedure, router } from "../index";
import { db } from "../../lib/auth";

export const departmentRouter = router({
  getAll: publicProcedure.query(async ({}) => {
    return await db.department.findMany();
  }),
  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        code: z.string(),
      })
    )
    .mutation(async ({ input: { name, code } }) => {
      return await db.department.create({ data: { name, code } });
    }),
  update: publicProcedure
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
