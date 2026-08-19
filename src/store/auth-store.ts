import { create } from "zustand";
import { getCurrentUserAction, logoutCustomerAction } from "@/lib/actions";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  role: string;
}

interface AuthStore {
  user: AuthUser | null;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  checkAuth: () => Promise<AuthUser | null>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  checkAuth: async () => {
    try {
      const res = await getCurrentUserAction();
      if (res.success && res.user) {
        set({ user: res.user as any, isLoading: false });
        return res.user as any;
      } else {
        set({ user: null, isLoading: false });
        return null;
      }
    } catch {
      set({ user: null, isLoading: false });
      return null;
    }
  },
  logout: async () => {
    try {
      await logoutCustomerAction();
    } finally {
      set({ user: null, isLoading: false });
    }
  },
}));
