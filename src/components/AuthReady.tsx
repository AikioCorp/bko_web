"use client";

import React, { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

// Les pages protégées lisent le token en mémoire dès leur montage : on attend donc la
// restauration de session (refresh par cookie) avant de les afficher.
export function AuthReady({ children }: { children: React.ReactNode }) {
  const isLoading = useAuthStore((s) => s.isLoading);
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) return null;
  return <>{children}</>;
}
