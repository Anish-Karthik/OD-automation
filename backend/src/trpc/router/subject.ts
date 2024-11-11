import { Prisma, Subject } from "@prisma/client";

import { z } from "zod";
import { db } from "../../lib/auth";
import { adminProcedure, router } from "../index";

const subjectInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  subjectCode: z.string().min(1, "Subject code is required"),
  semester: z.string().min(1).max(10),
});

const upsertSubject = async (subject: z.infer<typeof subjectInputSchema>) => {
  return await db.subject.upsert({
    where: { subjectCode: subject.subjectCode },
    update: {
      ...subject,
    },
    create: {
      ...subject,
    },
  });
}

export const subjectRouter = router({

  list: adminProcedure.query(async () => {
    return await db.subject.findMany();
  }),

  get: adminProcedure.query(async ({ input }) => {
    return await db.subject.findUnique({
      where: { id: input },
    });
  }
  ),

  create: adminProcedure
    .input(subjectInputSchema)
    .mutation(async ({ input }) => {
      return await upsertSubject(input);
    }),


  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await db.subject.delete({
        where: {
          id: input.id,
        },
      });
    }),
});

