import React from "react";
import { AuthReady } from "@/components/AuthReady";
import { StudioGuard } from "@/components/studio/StudioGuard";
import { StudioShell } from "@/components/studio/StudioShell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthReady>
      <StudioGuard>
        <StudioShell>{children}</StudioShell>
      </StudioGuard>
    </AuthReady>
  );
}
