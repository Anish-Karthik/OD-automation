import { router } from "../index";

import { studentRouter } from "./student";
import { teacherRouter } from "./teacher";

export const userRouter = router({
  student: studentRouter,
  teacher: teacherRouter,
  // admin: adminRouter,
});
