"use client";

import React, { createContext, useContext } from "react";

export interface AdminAccess {
  isSuperAdmin: boolean;
  roles: string[];
  permissions: string[];
}

const Ctx = createContext<AdminAccess>({ isSuperAdmin: false, roles: [], permissions: [] });

export function AccessProvider({ value, children }: { value: AdminAccess; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** `can("moderation.edit")` : l'interface masque ce que le serveur refuserait de toute façon. */
export function useAccess() {
  const a = useContext(Ctx);
  return { ...a, can: (perm: string) => a.permissions.includes(perm) };
}
