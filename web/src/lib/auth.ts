import { api } from "./axiosConfig";
import { AuthUser } from "../../../backend/src";

export async function currentUser(): Promise<AuthUser | null> {
  try {
    const {
      data: { user },
    } = await api.get("/api/auth/currentUser");
    return user;
  } catch (error) {
    console.log(error);
    return null;
  }
}
