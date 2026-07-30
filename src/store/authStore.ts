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
    localStorage.setItem("bko_access_token", accessToken);
    set({ user, accessToken, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    const token = localStorage.getItem("bko_access_token");
    if (token) {
      try {
        await fetch("http://localhost:8080/api/v1/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) {}
    }
    localStorage.removeItem("bko_access_token");
    set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem("bko_access_token");
    if (!token) {
      set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const res = await fetch("http://localhost:8080/api/v1/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        set({ user: json.data, accessToken: token, isAuthenticated: true, isLoading: false });
      } else {
        localStorage.removeItem("bko_access_token");
        set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
      }
    } catch (err) {
      set({ isLoading: false });
    }
  },
}));
