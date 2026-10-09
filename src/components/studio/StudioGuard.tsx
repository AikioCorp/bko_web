"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export function StudioGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname || "/studio")}`);
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-sm text-gray-400">
        VÃ©rification des accÃ¨s...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-sm text-gray-400">
        Redirection vers la page de connexion...
      </div>
    );
  }

  return <>{children}</>;
}

