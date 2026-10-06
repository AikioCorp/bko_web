"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export function AuthInitializer() {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();

    // Synchronisation multi-onglets si l'utilisateur se connecte ou se déconnecte ailleurs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "bko_access_token" || e.key === "bko_user_profile" || e.key === "bko_refresh_token") {
        checkAuth();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [checkAuth]);

  return null;
}
