import React from "react";
import { AuthReady } from "@/components/AuthReady";
import { AdminShell } from "@/components/admin/AdminShell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthReady>
      <AdminShell>{children}</AdminShell>
    </AuthReady>
  );
}

