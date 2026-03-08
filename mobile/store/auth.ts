import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import api from "../lib/api";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "CITIZEN" | "LGU_ADMIN" | "FIELD_WORKER";
  phone?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  loadSession: async () => {
    try {
      const token = await SecureStore.getItemAsync("bluewaste_token");
      const userStr = await SecureStore.getItemAsync("bluewaste_user");
      if (token && userStr) {
        set({ token, user: JSON.parse(userStr), isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    await SecureStore.setItemAsync("bluewaste_token", data.token);
    await SecureStore.setItemAsync("bluewaste_user", JSON.stringify(data.user));
    set({ user: data.user, token: data.token });
  },

  register: async (registerData) => {
    const { data } = await api.post("/auth/register", registerData);
    await SecureStore.setItemAsync("bluewaste_token", data.token);
    await SecureStore.setItemAsync("bluewaste_user", JSON.stringify(data.user));
    set({ user: data.user, token: data.token });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync("bluewaste_token");
    await SecureStore.deleteItemAsync("bluewaste_user");
    set({ user: null, token: null });
  },
}));
