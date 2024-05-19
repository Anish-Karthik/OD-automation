import axios from "axios";

const baseURL =
  process.env.NEXT_PUBLIC_SERVICE_BASE_URL || "http://localhost:3000";

export const api = axios.create({
  baseURL,
  timeout: 1000,
  maxBodyLength: Infinity,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});
