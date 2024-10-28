import { protectedProcedure, router } from "../index";
import { db } from "../../lib/auth";
import z from "zod";
import { Form, FormType } from "@prisma/client";
import { createRequest } from "../../actions/request";

export const teacherFormRouter = router({
  list: protectedProcedure.input(z.string()).query(async ({ input: userId, ctx }) => {
    if (ctx.user?.id !== userId) {
      throw new Error("Unauthorized");
    }
    return await db.form.findMany({
      where: {
        requests: {
          some: {
            requestedId: userId,
          },
        },
      },
      include: {
        requester: {
          include: {
            student: true,
          },
        },
        requests: {
          include: {
            requested: true,
          },
        },
      },
    });
  }),
  acceptOrReject: protectedProcedure
    .input(
      z.object({
        requesterId: z.string(),
        requestId: z.string(),
        requestedId: z.string(),
        status: z.enum(["ACCEPTED", "REJECTED"]),
        reasonForRejection: z.string().nullish(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.id !== input.requestedId) {
        throw new Error("Unauthorized");
      }
      const request = await db.request.update({
        where: {
          id: input.requestId,
        },
        data: {
          status: input.status,
          reasonForRejection: input.reasonForRejection,
        },
        include: {
          requested: true,
        },
      });

      const student = await db.student.findUnique({
        where: { userId: input.requesterId },
        include: {
          tutor: true,
          yearInCharge: true,
          department: {
            include: {
              hod: true,
            },
          },
        },
      });

      let accepter = "";
      if (student!.tutor?.userId === input.requestedId) {
        accepter = "TUTOR";
      }
      if (student!.yearInCharge?.userId === input.requestedId) {
        accepter = "YEAR_IN_CHARGE";
      }
      if (student!.department!.hod?.userId === input.requestedId) {
        accepter = "HOD";
      }

      console.log(accepter);
      if (input.status === "ACCEPTED") {
        if (accepter === "TUTOR") {
          // update the form to be approved
          await createRequest({
            formId: request.formId,
            requestedId: student!.yearInCharge?.userId!,
          });
        }
        if (accepter === "YEAR_IN_CHARGE") {
          // update the form to be approved
          console.log("YEAR IN CHARGE");
          console.log(student);
          console.log(student!.department!.hod?.userId!);
          await createRequest({
            formId: request.formId,
            requestedId: student!.department!.hod?.userId!,
          });
        }
        if (accepter === "HOD") {
          // OD/Leave is granted
        }
      }

      const form = await db.form.findUnique({
        where: { id: request.formId },
        include: {
          requests: {
            include: {
              requested: true,
            },
          },
        },
      });
      return form;
    }),
});
