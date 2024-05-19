
// import { z } from "zod";
import { publicProcedure, router } from "../index";


export const appRouter = router({
  list: publicProcedure.query(async () => {
    return [1, 2, 3];
  }),
  hello: publicProcedure.query(async () => {
    return "world";
  }),
});
