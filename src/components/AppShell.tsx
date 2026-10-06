"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { PersistentPlayer } from "./player/PersistentPlayer";
import { StudioShell } from "./studio/StudioShell";
import { AdminShell } from "./admin/AdminShell";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  
  if (pathname.startsWith("/admin") || pathname.startsWith("/studio")) {
    return <>{children}</>;
  }

  // Otherwise, use the standard public App Shell with music player
  return (
    <>
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="hidden lg:block shrink-0 h-full">
          <Sidebar />
        </div>

        {/* Right Main Column with Sticky Header & Scrollable Content */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#0B0B0B]">
          <Header />

          <div className="flex-1 overflow-y-auto relative scrollbar-thin scrollbar-thumb-[#262626] scrollbar-track-transparent">
            <main className="min-h-full pb-28 md:pb-24">
              {children}
            </main>
          </div>
        </div>
      </div>

      {/* Global Persistent Player */}
      <PersistentPlayer />
    </>
  );
}
