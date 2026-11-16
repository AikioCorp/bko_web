"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";
import { PersistentPlayer } from "./player/PersistentPlayer";
import { StudioShell } from "./studio/StudioShell";
import { AdminShell } from "./admin/AdminShell";
import { AliChatBubble } from "./chat/AliChatBubble";
import { PreferencesCatchUpModal } from "./modals/PreferencesCatchUpModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const saved = sessionStorage.getItem(`scroll-${pathname}`);
    if (saved) {
      container.scrollTop = parseInt(saved, 10);
    } else {
      container.scrollTop = 0;
    }

    let timeoutId: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        sessionStorage.setItem(`scroll-${pathname}`, container.scrollTop.toString());
      }, 100);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      clearTimeout(timeoutId);
      container.removeEventListener("scroll", handleScroll);
    };
  }, [pathname]);
  
  if (pathname.startsWith("/admin") || pathname.startsWith("/studio")) {
    return <>{children}</>;
  }

  // Otherwise, use the standard public App Shell with music player
  return (
    <>
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar (Desktop) */}
        <div className="hidden lg:block shrink-0 h-full">
          <Suspense fallback={null}>
            <Sidebar />
          </Suspense>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/70"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="relative z-10 h-full bg-[#0F0F0F] shadow-2xl">
              <Suspense fallback={null}>
                <Sidebar />
              </Suspense>
            </div>
          </div>
        )}

        {/* Right Main Column with Sticky Header & Scrollable Content */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#0B0B0B]">
          <Header onToggleMobileMenu={() => setMobileMenuOpen((v) => !v)} />

          <div ref={scrollRef} className="flex-1 overflow-y-auto relative scrollbar-thin scrollbar-thumb-[#262626] scrollbar-track-transparent">
            <main className="min-h-full pb-28 md:pb-24">
              {children}
            </main>
            <Footer />
          </div>
        </div>
      </div>

      {/* Global Persistent Player */}
      <PersistentPlayer />

      {/* Ali Cultural Advisor Draggable Floating Chat */}
      <AliChatBubble />

      {/* Preferences Catch-Up Modal for eligible accounts */}
      <PreferencesCatchUpModal />
    </>
  );
}
