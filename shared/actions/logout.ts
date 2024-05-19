import { api } from "../axiosConfig";

export const logout = async () => {
  try {
    const res = await api.post("/api/auth/logout");
    if (res.status === 200) return true;
    return false;
  } catch (error) {
    console.log(error);
    return false;
  }
};
