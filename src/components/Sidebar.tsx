"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BkoLogo } from "./ui/BkoLogo";
import { Home, Compass, Bookmark, Radio, Smartphone, ShieldCheck } from "lucide-react";
import { useConsoleAccess } from "@/hooks/useConsoleAccess";

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { hasConsole, landing } = useConsoleAccess();

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
      label: "Bibliothèque",
      href: "/library",
      icon: Bookmark,
      exact: false,
    },
    {
      label: "Espace Créateurs / Studio",
      href: "/studio",
      icon: Radio,
      exact: false,
    },
    // Visible uniquement pour les comptes ayant accès à la console d'administration.
    ...(hasConsole ? [{ label: "Console d'administration", href: landing, icon: ShieldCheck, exact: false }] : []),
  ];

  return (
    <aside className="w-64 bg-[#0F0F0F] border-r border-[#1F1F1F] flex flex-col justify-between shrink-0 h-full p-4 select-none">
      {/* Top Header & Brand */}
      <div className="space-y-6">
        <div className="px-2 pt-1 pb-2">
          <BkoLogo size="md" />
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
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[#1E1E1E] text-[#FFBF00] shadow-sm"
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
      <div className="pt-4 border-t border-[#1C1C1C]">
        <div className="bg-[#141414] border border-[#222222] rounded-xl p-3 space-y-1.5">
          <div className="flex items-center gap-2 text-[#FFBF00]">
            <Smartphone className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Application Mobile</span>
          </div>
          <p className="text-[11px] text-[#888888] leading-tight">
            Mode économie de données exclusif disponible sur l'app Android & iOS.
          </p>
        </div>
      </div>
    </aside>
  );
};
