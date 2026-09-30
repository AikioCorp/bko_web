"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Minimalist, Apple-style SVG Icons
const IconNew = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const IconCharts = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
  </svg>
);

const IconCategories = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const IconHistory = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconSubscriptions = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);

const IconSaved = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
  </svg>
);

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  if (pathname.startsWith("/admin") || pathname.startsWith("/studio")) {
    return null;
  }

  const mainNav = [
    { label: "Nouveautés", href: "/new", icon: <IconNew /> },
    { label: "Top Charts", href: "/charts", icon: <IconCharts /> },
    { label: "Catégories", href: "/categories", icon: <IconCategories /> },
  ];

  const libraryNav = [
    { label: "Écoutés récemment", href: "/library/history", icon: <IconHistory /> },
    { label: "Mes Abonnements", href: "/library/subscriptions", icon: <IconSubscriptions /> },
    { label: "Sauvegardés", href: "/library/saved", icon: <IconSaved /> },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-[260px] bg-[#0B0F17] border-r border-[#161B22] h-full overflow-y-auto shrink-0 scrollbar-thin scrollbar-thumb-[#21262D] scrollbar-track-transparent">
      <div className="flex flex-col gap-6 p-4">
        
        {/* Section Découvrir */}
        <div>
          <h3 className="text-[11px] font-bold text-[#8B949E] uppercase tracking-wider mb-2 px-3">Découvrir</h3>
          <nav className="flex flex-col gap-0.5">
            {mainNav.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-[#161B22] text-[#E6B009]"
                      : "text-[#8B949E] hover:bg-[#161B22] hover:text-[#F0F6FC]"
                  }`}
                >
                  <span className={`${isActive ? "text-[#E6B009]" : "text-[#8B949E]"}`}>{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Section Bibliothèque */}
        <div>
          <h3 className="text-[11px] font-bold text-[#8B949E] uppercase tracking-wider mb-2 px-3">Bibliothèque</h3>
          <nav className="flex flex-col gap-0.5">
            {libraryNav.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-[#161B22] text-[#E6B009]"
                      : "text-[#8B949E] hover:bg-[#161B22] hover:text-[#F0F6FC]"
                  }`}
                >
                  <span className={`${isActive ? "text-[#E6B009]" : "text-[#8B949E]"}`}>{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        
      </div>
    </aside>
  );
};
