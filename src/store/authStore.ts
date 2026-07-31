import { API_BASE_URL } from "@/lib/api";
import { create } from "zustand";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatar?: string | null;
  phoneNumber?: string | null;
  roles: string[];
  permissions: string[];
  languagePreferences?: Array<{ languageCode: string }>;
  topicPreferences?: Array<{ topicId: string }>;
  countryPreferences?: Array<{ countryId: string }>;
}

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (user: UserProfile, accessToken: string) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, accessToken) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("bko_access_token", accessToken);
    }
    set({ user, accessToken, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("bko_access_token") : null;
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch (e) {}
    if (typeof window !== "undefined") {
      localStorage.removeItem("bko_access_token");
    }
    set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
  },

  checkAuth: async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("bko_access_token") : null;

    try {
      const res = await fetch(`${API_BASE_URL}/me`, {
        credentials: "include",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await res.json();
      if (json.success) {
        set({ user: json.data, accessToken: token, isAuthenticated: true, isLoading: false });
      } else {
        if (typeof window !== "undefined") {
          localStorage.removeItem("bko_access_token");
        }
        set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
      }
    } catch (err) {
      set({ isLoading: false });
    }
  },
}));
