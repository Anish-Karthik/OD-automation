import { db } from "../../lib/auth";

export const createRequest = async ({
  formId,
  requestedId,
}: {
  formId: string;
  requestedId: string;
}) => {
  return await db.request.create({
    data: {
      status: "PENDING",
      formId: formId,
      requestedId,
    },
    include: {
      requested: true,
    },
  });
};
