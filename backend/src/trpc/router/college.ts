import { z } from "zod"

import { publicProcedure, router } from "../index"
import { db } from "../../lib/auth"

export const collegeRouter = router({
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        logo: z.string().url().nullish(),
        coverImage: z.string().url().nullish(),
        name: z.string().nullish(),
        district: z.string().nullish(),
        description: z.string().nullish(),
        code: z.string().nullish(),
        aishe: z.string().nullish(),
        state: z.string().nullish(),
        pincode: z.string().nullish(),
        address: z.string().nullish(),
        phone: z.string().nullish(),
        email: z.string().nullish(),
      })
    )
    .mutation(async ({ input }) => {
      return await db.college.update({
        where: { id: input.id },
        data: { ...input },
      })
    }),
})
