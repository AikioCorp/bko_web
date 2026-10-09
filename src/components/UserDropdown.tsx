"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogIn, UserPlus, ShieldCheck, Radio, Bookmark, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export function UserDropdown() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  let hoverTimeout: NodeJS.Timeout;

  const handleMouseEnter = () => {
    clearTimeout(hoverTimeout);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    hoverTimeout = setTimeout(() => setIsOpen(false), 200);
  };

  const isSuperAdmin = user?.roles?.some((r) => r.toUpperCase() === "SUPER_ADMIN");
  const isAdmin = user?.roles?.some((r) => r.toUpperCase() === "ADMIN");
  const isCreator = user?.roles?.some((r) => r.toUpperCase() === "CREATOR" || r.toUpperCase() === "EDITOR");
  const canAccessConsole = isSuperAdmin || isAdmin;

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all overflow-hidden ${mounted && isAuthenticated
            ? "bg-[#FFBF00] text-[#0B0B0B] font-bold text-xs shadow-md"
            : "bg-[#161616] border border-[#2A2A2A] text-[#B8B8B8] hover:text-white hover:border-[#FFBF00]/50"
        }`}
        aria-label="Menu utilisateur"
      >
        {mounted && isAuthenticated && user?.avatar ? (
          <img
            src={user.avatar}
            alt={user.fullName || "Utilisateur"}
            className="w-full h-full object-cover"
          />
        ) : mounted && isAuthenticated && user?.fullName ? (
          user.fullName.charAt(0).toUpperCase()
        ) : (
          <User className="w-4 h-4" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-[#141414] border border-[#282828] rounded-2xl p-2 shadow-2xl z-50 animate-fade-in space-y-1">
          {!mounted || !isAuthenticated ? (
            <>
              <div className="px-3 py-2 border-b border-[#222222]">
                <p className="text-xs font-bold text-white">Bienvenue</p>
                <p className="text-[10px] text-[#757575]">
                  AccÃ©dez Ã  vos podcasts et synchronisez vos Ã©coutes.
                </p>
              </div>
              <div className="p-1 space-y-1">
                <Link
                  href="/login?tab=login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-white hover:bg-[#1E1E1E] transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#FFBF00]" />
                  <span>Connexion</span>
                </Link>
                <Link
                  href="/login?tab=register"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#FFBF00] text-[#0B0B0B] hover:bg-[#E5AB00] transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>S'inscrire</span>
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="px-3 py-2.5 border-b border-[#222222]">
                <div className="flex items-center justify-between gap-1.5">
                  <p className="text-xs font-bold text-white truncate">{user?.fullName || "Utilisateur"}</p>
                  <span className="text-[9px] font-extrabold uppercase bg-[#FFBF00] text-[#0B0B0B] px-1.5 py-0.5 rounded shrink-0">
                    {isSuperAdmin
                      ? "Super Admin"
                      : isAdmin
                      ? "Admin"
                      : isCreator
                      ? "CrÃ©ateur"
                      : "Auditeur"}
                  </span>
                </div>
                <p className="text-[10px] text-[#757575] truncate mt-0.5">{user?.email}</p>
              </div>

              <div className="p-1 space-y-0.5">
                {canAccessConsole && (
                  <Link
                    href="/admin/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[#FFBF00] bg-[#FFBF00]/10 hover:bg-[#FFBF00]/20 transition-colors font-bold"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Tableau de bord (Admin)</span>
                  </Link>
                )}
                {isCreator && (
                  <Link
                    href="/studio"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white hover:bg-[#1E1E1E] transition-colors font-medium"
                  >
                    <Radio className="w-3.5 h-3.5 text-[#FFBF00]" />
                    <span>Studio CrÃ©ateur</span>
                  </Link>
                )}
                <Link
                  href={canAccessConsole ? "/admin/profile" : (isCreator ? "/studio/profile" : "/profile")}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[#B8B8B8] hover:text-white hover:bg-[#1E1E1E] transition-colors"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Mon Profil</span>
                </Link>
                <Link
                  href="/library"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[#B8B8B8] hover:text-white hover:bg-[#1E1E1E] transition-colors"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Ma BibliothÃ¨que</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-[#222222]">
                <button
                  onClick={async () => {
                    await logout();
                    setIsOpen(false);
                    router.push("/login?tab=login");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-[#1E1E1E] transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Se dÃ©connecter</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

