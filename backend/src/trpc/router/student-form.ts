import { FormType } from "@prisma/client";
import z from "zod";
import { createRequest } from "../../actions/request";
import { db } from "../../lib/auth";
import { protectedProcedure, router } from "../index";

export const studentFormRouter = router({
  list: protectedProcedure.input(z.string()).query(async ({ input: userId, ctx }) => {
    if (ctx.user?.id !== userId) {
      throw new Error("Unauthorized");
    }
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
  create: protectedProcedure
    .input(
      z.object({
        reason: z.string(),
        requesterId: z.string(),
        category: z.string(),
        formType: z.nativeEnum(FormType),
        dates: z.array(z.string()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      console.log("TRPC");
      console.log(input);
      if (ctx.user?.id !== input.requesterId) {
        throw new Error("Unauthorized");
      }
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
      const request = await createRequest({
        formId: form.id,
        requestedId: student.tutor?.userId!,
      });
      console.log(request);
      return {
        ...form,
        requests: [request],
      };
    }),
});
