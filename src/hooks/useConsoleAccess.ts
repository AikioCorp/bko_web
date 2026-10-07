"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import { useAuthStore } from "@/store/authStore";

/**
 * Indique si la personne connectée a accès à la console d'administration (au moins une permission).
 * Les droits viennent du serveur ; ce lien n'est qu'un raccourci, l'accès réel est vérifié côté API.
 */
export function useConsoleAccess() {

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.user?.id);
  const [hasConsole, setHasConsole] = useState(false);
  const [landing, setLanding] = useState("/admin/dashboard");

  useEffect(() => {
    if (!isAuthenticated) {
      setHasConsole(false);
      return;
    }
    let cancelled = false;
    adminApi<{ permissions: string[] }>("/admin/access")
      .then((a) => {
        if (cancelled) return;
        setHasConsole(a.permissions.length > 0);
        // Première page à laquelle la personne a réellement droit.
        const order: [string, string][] = [
          ["dashboard.view", "/admin/dashboard"],
          ["reviews.view", "/admin/dashboard"],
          ["moderation.view", "/admin/moderation"],
          ["catalog.view", "/admin/catalog"],
          ["claims.view", "/admin/claims"],
          ["users.view", "/admin/users"],
          ["roles.view", "/admin/roles"],
          ["markets.view", "/admin/markets"],
          ["storage.view", "/admin/storage"],
          ["audit.view", "/admin/audit"],
          ["settings.view", "/admin/settings"],
        ];
        setLanding(order.find(([p]) => a.permissions.includes(p))?.[1] ?? "/admin/dashboard");
      })
      .catch(() => !cancelled && setHasConsole(false));
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, userId]);

  return { hasConsole, landing };
}
