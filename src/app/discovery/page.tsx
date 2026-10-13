"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function DiscoveryRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const secId =
      searchParams.get("sectionId") ||
      searchParams.get("section") ||
      searchParams.get("slug");

    if (secId) {
      const query = new URLSearchParams(searchParams.toString());
      query.delete("sectionId");
      query.delete("section");
      query.delete("slug");
      const qs = query.toString();
      router.replace(`/discovery/sections/${encodeURIComponent(secId)}${qs ? `?${qs}` : ""}`);
    } else {
      router.replace("/explore");
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#FFBF00] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function DiscoveryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#FFBF00] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DiscoveryRedirect />
    </Suspense>
  );
}
