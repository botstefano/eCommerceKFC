import { create } from "zustand";
import api from "../services/api";
import { User } from "../types";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, phone?: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  refreshUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem("kfc_token"),
  loading: false,
  initialized: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("kfc_token", data.token);
      set({ user: data.user, token: data.token, loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  register: async (email, password, name, phone) => {
    set({ loading: true });
    try {
      const { data } = await api.post("/auth/register", { email, password, name, phone });
      localStorage.setItem("kfc_token", data.token);
      set({ user: data.user, token: data.token, loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem("kfc_token");
    set({ user: null, token: null });
  },

  fetchMe: async () => {
    const token = get().token;
    if (!token) {
      set({ initialized: true });
      return;
    }
    try {
      const { data } = await api.get("/auth/me");
      set({ user: data.user, initialized: true });
    } catch {
      localStorage.removeItem("kfc_token");
      set({ user: null, token: null, initialized: true });
    }
  },

  refreshUser: (user) => set({ user }),
}));
