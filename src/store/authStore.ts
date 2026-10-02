import { API_BASE_URL } from "@/lib/api";
import { create } from "zustand";
import { getAccessToken, setAccessToken, refreshAccessToken } from "@/lib/token";

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

let checkPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, accessToken) => {
    setAccessToken(accessToken);
    set({ user, accessToken, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, { method: "POST", credentials: "include" });
    } catch (e) {}
    setAccessToken(null);
    set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
  },

  // Restaure la session : le token n'existe qu'en mémoire, donc après un rechargement on
  // le récupère via le cookie httpOnly de refresh. Dédupliqué pour les appels concurrents.
  checkAuth: () => {
    if (!checkPromise) {
      checkPromise = (async () => {
        try {
          if (!getAccessToken()) await refreshAccessToken();
          const token = getAccessToken();
          if (!token) {
            set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
            return;
          }
          const res = await fetch(`${API_BASE_URL}/me`, { credentials: "include" });
          const json = await res.json();
          if (json.success) {
            set({ user: json.data, accessToken: getAccessToken(), isAuthenticated: true, isLoading: false });
          } else {
            setAccessToken(null);
            set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
          }
        } catch (err) {
          set({ isLoading: false });
        } finally {
          checkPromise = null;
        }
      })();
    }
    return checkPromise;
  },
}));
