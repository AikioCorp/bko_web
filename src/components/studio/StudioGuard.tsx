"use client";
import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import useSWR from "swr";
import { useAuthStore } from "@/store/authStore";
import { fetchApi } from "@/lib/api";

export function StudioGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const onboarding = pathname === "/studio/onboarding";
  const { data, error, mutate } = useSWR(
    isAuthenticated && !onboarding ? ["/me/studio-access", user?.id] : null,
    ([url]) => fetchApi<{ canAccess: boolean }>(url).then(res => res.data),
    { revalidateOnFocus: true, shouldRetryOnError: false },
  );
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) router.replace(`/login?redirect=${encodeURIComponent(pathname || "/studio")}`);
    else if (!onboarding && data && !data.canAccess) router.replace("/studio/onboarding");
  }, [isLoading, isAuthenticated, onboarding, data, pathname, router]);
  if (error) return <div role="alert" className="p-6 text-center">
    Impossible de vérifier votre accès au Studio.
    <button className="ml-3 text-[#FFBF00]" onClick={() => mutate()}>Réessayer</button>
  </div>;
  if (isLoading || !isAuthenticated || (!onboarding && !data?.canAccess)) {
    return <div className="min-h-[50vh] flex items-center justify-center text-sm text-gray-400">Vérification des accès...</div>;
  }
  return <>{children}</>;
}
