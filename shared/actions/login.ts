import { api } from "../axiosConfig";
import { PrismaTypes } from "../../backend/src";

export const login = async (username: string, password: string) => {
  // try {
  const response = await api.post("/api/auth/login", { username, password });
  return response;
  // const data: {
  //   session: PrismaTypes.Session;
  //   user: PrismaTypes.User;
  // } = response.data;
  // const { session, user } = data;
  // return { session, user };
  // } catch (error) {
  //   console.log(error);
  //   throw new Error("Login failed");
  // }
};
