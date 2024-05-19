import type { PrismaTypes } from "../../backend/src";
import { currentUser, login, logout } from "../actions";
import { create } from "zustand";

interface UseAuth {
  currentUser: PrismaTypes.User | null;
  fetching: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
}

export const useAuth = create<UseAuth>((set) => ({
  currentUser: null,
  fetching: false,
  login: async (username, password) => {
    set({ fetching: true });
    try {
      const res = await login(username, password);
      const data = res.data;
      const user = res.data.user;
      set({ currentUser: user, fetching: false });
    } catch (error) {
      console.log(error);
      set({ fetching: false, currentUser: null });
    }
  },
  logout: async () => {
    await logout();
    set({ currentUser: null });
  },
  fetchCurrentUser: async () => {
    try {
      set({ fetching: true });
      const user = await currentUser();
      console.log(user);
      set({ currentUser: user, fetching: false });
    } catch (error: any) {
      console.log(error.message);
    }
  },
}));
