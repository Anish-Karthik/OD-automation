import { publicProcedure, router } from "../index";
import { db } from "../../lib/auth";
import z from "zod";
import { Form, FormType } from "@prisma/client";

export const studentFormRouter = router({
  list: publicProcedure.input(z.string()).query(async ({ input: userId }) => {
    return await db.form.findMany({
      where: { requesterId: userId },
      include: {
        requests: {
          include: {
            requested: true,
          },
        },
      },
    });
  }),
  create: publicProcedure
    .input(
      z.object({
        reason: z.string(),
        requesterId: z.string(),
        category: z.string(),
        formType: z.nativeEnum(FormType),
        dates: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      console.log("TRPC");
      console.log(input);
      const form = await db.form.create({
        data: { ...input, dates: input.dates.map((date) => new Date(date)) },
      });
      console.log(form);
      // create a request to the tutor of this student
      const student = await db.student.findUnique({
        where: { userId: input.requesterId },
        include: {
          tutor: true,
        },
      });
      if (!student) {
        throw new Error("Student not found");
      }
      console.log(student);
      const request = await db.request.create({
        data: {
          status: "PENDING",
          formId: form.id,
          requestedId: student.tutor?.userId!,
        },
        include: {
          requested: true,
        },
      });
      console.log(request);
      return {
        ...form,
        requests: [request],
      };
    }),
});
