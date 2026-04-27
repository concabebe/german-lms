import { create } from "zustand";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { User as DbUser, UserRole, UserStatus } from "@/types/database";

interface AuthState {
  user: SupabaseUser | null;
  profile: DbUser | null;
  loading: boolean;
  setUser: (user: SupabaseUser | null) => void;
  setProfile: (profile: DbUser | null) => void;
  setLoading: (loading: boolean) => void;
  role: UserRole | null;
  status: UserStatus | null;
  isAdmin: boolean;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  role: null,
  status: null,
  isAdmin: false,
  setUser: (user) => set({ user }),
  setProfile: (profile) =>
    set({
      profile,
      role: profile?.role ?? null,
      status: profile?.status ?? null,
      isAdmin: profile?.role === "admin",
    }),
  setLoading: (loading) => set({ loading }),
}));
