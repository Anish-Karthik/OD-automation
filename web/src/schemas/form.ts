import { z } from "zod";

export const formSchema = z.object({
  category: z.string().min(2, {
    message: "category is required",
  }),
  reason: z.string().min(2, {
    message: "reason is required",
  }),
  formType: z.enum(["ON_DUTY", "LEAVE"]),
});
