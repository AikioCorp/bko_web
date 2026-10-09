"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, Compass, Bookmark, Radio, Smartphone, ShieldCheck, Star, Download, ArrowRight, Mic } from "lucide-react";
import { useConsoleAccess } from "@/hooks/useConsoleAccess";
import { AppDownloadModal } from "./modals/AppDownloadModal";

import { useAuthStore } from "@/store/authStore";

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { hasConsole } = useConsoleAccess();
  const { user, isAuthenticated } = useAuthStore();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const isAdmin = isMounted && isAuthenticated && Boolean(
    user?.roles?.some((r) => ["ADMIN", "SUPER_ADMIN"].includes(r.toUpperCase()))
  );
  
  const isCreator = isMounted && isAuthenticated && Boolean(
    user?.roles?.includes("CREATOR") ||
    user?.roles?.includes("ADMIN") ||
    user?.permissions?.includes("publish:episodes")
  );

  const showConsole = hasConsole || isAdmin;
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navItems = [
    {
      label: "Accueil",
      href: "/",
      icon: Home,
      exact: true,
    },
    {
      label: "Explorer & Rechercher",
      href: "/explore",
      icon: Compass,
      exact: false,
    },
    {
      label: "BibliothÃ¨que",
      href: "/library",
      icon: Bookmark,
      exact: false,
    },
    {
      label: "Notre Studio (Tarifs)",
      href: "/tarifs",
      icon: Mic,
      exact: false,
    },
    // Creator space or Become a Creator
    ...(isCreator
      ? [{ label: "Espace CrÃ©ateurs / Studio", href: "/studio", icon: Radio, exact: false }]
      : [{ label: "Devenir CrÃ©ateur", href: "/become-creator", icon: Star, exact: false }]
    ),
    // Visible uniquement pour les comptes ayant accÃ¨s Ã  la console d'administration.
    ...(showConsole ? [{ label: "Console d'administration", href: "/admin/dashboard", icon: ShieldCheck, exact: false }] : []),
  ];

  return (
    <aside className="w-64 bg-[#0F0F0F] border-r border-[#1F1F1F] flex flex-col justify-between shrink-0 h-full p-4 overflow-y-auto scrollbar-none select-none">
      {/* Top Header & Brand */}
      <div className="space-y-6">
        <div className="px-2 pt-1 pb-2">
          <Link href="/">
            <Image 
              src="/brand/logo.webp" 
              alt="Bamako Podcast" 
              width={160} 
              height={50} 
              className="w-auto h-11 object-contain"
              priority
            />
          </Link>
        </div>

        {/* Primary Navigation Pills */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-[#1E1E1E] text-[#FFBF00] font-semibold shadow-sm"
                    : "text-[#B8B8B8] hover:text-white hover:bg-[#161616]"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-[#FFBF00]" : "text-[#888888]"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom App Mobile Download Callout */}
      <div className="pt-4 border-t border-[#1C1C1C] pb-24 md:pb-28">
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full text-left bg-[#141414] hover:bg-[#1A1A1A] border border-[#222222] hover:border-[#FFBF00]/40 rounded-xl p-3 space-y-2 transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#FFBF00]">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">App Mobile</span>
            </div>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <p className="text-[11px] text-[#888888] leading-tight">
            Ã‰coutez vos podcasts partout, hors-ligne et sans coupure.
          </p>
          <span className="inline-flex items-center gap-1 text-[11px] text-[#FFBF00] font-bold">
            <Download className="w-3 h-3" />
            <span>TÃ©lÃ©charger l'App</span>
          </span>
        </button>
      </div>

      <AppDownloadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </aside>
  );
};

