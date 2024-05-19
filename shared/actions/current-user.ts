import { api } from "../axiosConfig";
import type { PrismaTypes } from "../../backend/src";

export async function currentUser(): Promise<PrismaTypes.User | null> {
  try {
    const res = await api.get("/api/auth/currentUser");
    console.log(res)
    const user: PrismaTypes.User = res.data.user;
    console.log(user);
    return user;
  } catch (error) {
    console.log(error);
    return null;
  }
}
