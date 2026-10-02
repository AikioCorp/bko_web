"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Plus, User, LogIn, UserPlus, LogOut, Radio, Menu, ShieldCheck } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { BkoLogo } from "./ui/BkoLogo";
import { NotificationBell } from "./NotificationBell";
import { useConsoleAccess } from "@/hooks/useConsoleAccess";
import { API_BASE_URL } from "@/lib/api";

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

interface LanguageItem {
  code: string;
  name: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout, checkAuth } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeLang, setActiveLang] = useState<string>("ALL");
  const [languages, setLanguages] = useState<LanguageItem[]>([
    { code: "ALL", name: "Tous" },
    { code: "fr", name: "Français" },
    { code: "bm", name: "Bamanankan" },
  ]);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { hasConsole, landing } = useConsoleAccess();
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync active language from URL query if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const langParam = params.get("lang");
      if (langParam) {
        setActiveLang(langParam);
      }
    }
  }, [pathname]);

  // Check user authentication status on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Fetch languages dynamically from API
  useEffect(() => {
    fetch(`${API_BASE_URL}/languages`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const apiLangs = json.data.map((l: any) => ({
            code: l.code || l.id,
            name: l.nativeName || l.name,
          }));
          setLanguages([{ code: "ALL", name: "Tous" }, ...apiLangs.slice(0, 3)]);
        }
      })
      .catch(() => {
        // Fallback already defined
      });
  }, []);

  const isCreator =
    isAuthenticated &&
    Boolean(
      user?.roles?.includes("CREATOR") ||
      user?.roles?.includes("ADMIN") ||
      user?.permissions?.includes("publish:episodes")
    );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    const targetUrl = query
      ? `/explore?q=${encodeURIComponent(query)}&lang=${activeLang}`
      : `/explore?lang=${activeLang}`;
    router.push(targetUrl);
  };

  const handleLanguageChange = (code: string) => {
    setActiveLang(code);
    let currentQuery = searchQuery.trim();
    if (!currentQuery && typeof window !== "undefined") {
      currentQuery = new URLSearchParams(window.location.search).get("q") || "";
    }
    if (pathname === "/explore" || pathname === "/podcasts") {
      router.push(`${pathname}?${currentQuery ? `q=${encodeURIComponent(currentQuery)}&` : ""}lang=${code}`);
    } else {
      router.push(`/explore?${currentQuery ? `q=${encodeURIComponent(currentQuery)}&` : ""}lang=${code}`);
    }
  };

  const handleMouseEnterUser = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsUserMenuOpen(true);
  };

  const handleMouseLeaveUser = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsUserMenuOpen(false);
    }, 250);
  };

  const navLinks = [
    { label: "Accueil", href: "/" },
    { label: "Explorer", href: "/explore" },
    { label: "Podcasts", href: "/podcasts" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0B0B0B]/95 backdrop-blur border-b border-[#1A1A1A] px-4 md:px-8 py-2.5 flex items-center justify-between gap-4 select-none">
      {/* Left: Mobile Menu + Navigation Links */}
      <div className="flex items-center gap-6 min-w-0">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 text-[#B8B8B8] hover:text-white rounded-lg bg-[#161616]"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand logo shown on mobile or when sidebar hidden */}
        <div className="lg:hidden shrink-0">
          <BkoLogo size="sm" showText={false} />
        </div>

        {/* Nav Links: Accueil, Explorer, Podcasts (from user image) */}
        <nav className="hidden sm:flex items-center gap-6 text-xs font-semibold">
          {navLinks.map((link) => {
            const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors ${
                  isActive ? "text-[#FFBF00] font-bold" : "text-[#B8B8B8] hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Center: Search Bar with Language Filters inside */}
      <form
        onSubmit={handleSearchSubmit}
        className="flex-1 max-w-xl flex items-center bg-[#141414] border border-[#242424] rounded-full px-3 py-1.5 focus-within:border-[#FFBF00]/60 transition-colors shadow-inner"
      >
        <Search className="w-4 h-4 text-[#757575] shrink-0 ml-1 mr-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher un podcast, un épisode, une personne..."
          className="w-full bg-transparent text-xs text-white placeholder-[#757575] outline-none"
        />

        {/* Functional Language Filter Pills */}
        <div className="hidden md:flex items-center gap-1 ml-2 shrink-0">
          {languages.map((lang) => {
            const isSelected = activeLang === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleLanguageChange(lang.code)}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                  isSelected
                    ? "bg-[#FFBF00] text-[#0B0B0B] font-bold"
                    : "text-[#888888] hover:text-[#B8B8B8] hover:bg-[#1F1F1F]"
                }`}
              >
                {lang.name}
              </button>
            );
          })}
        </div>
      </form>

      {/* Right Actions: Publier (Creator Only) + Login Icon with Hover Popover */}
      <div className="flex items-center gap-3 shrink-0">
        {/* "+ Publier" Button: ONLY shown if creator is authenticated */}
        {isCreator && (
          <Link
            href="/studio"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1C1A14] border border-[#FFBF00]/40 text-[#FFBF00] hover:bg-[#FFBF00] hover:text-[#0B0B0B] text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Publier</span>
          </Link>
        )}

        {hasConsole && (
          <Link
            href={landing}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FFBF00] text-[#0B0B0B] hover:bg-[#E5AB00] text-xs font-bold transition-all shadow-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Administration</span>
          </Link>
        )}

        <NotificationBell />

        {/* User Icon Button with Hover Dropdown (no text on button, text shows on hover) */}
        <div
          className="relative"
          onMouseEnter={handleMouseEnterUser}
          onMouseLeave={handleMouseLeaveUser}
        >
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isAuthenticated
                ? "bg-[#FFBF00] text-[#0B0B0B] font-bold text-xs shadow-md"
                : "bg-[#161616] border border-[#2A2A2A] text-[#B8B8B8] hover:text-white hover:border-[#FFBF00]/50"
            }`}
            aria-label="Menu utilisateur"
          >
            {isAuthenticated && user?.fullName ? (
              user.fullName.charAt(0).toUpperCase()
            ) : (
              <User className="w-4 h-4" />
            )}
          </button>

          {/* Floating Dropdown on Hover */}
          {isUserMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-[#141414] border border-[#282828] rounded-2xl p-2 shadow-2xl z-50 animate-fade-in space-y-1">
              {!isAuthenticated ? (
                <>
                  <div className="px-3 py-2 border-b border-[#222222]">
                    <p className="text-xs font-bold text-white">Bienvenue</p>
                    <p className="text-[10px] text-[#757575]">
                      Accédez à vos podcasts et synchronisez vos écoutes.
                    </p>
                  </div>
                  <Link
                    href="/login?tab=login"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-white hover:bg-[#1E1E1E] transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5 text-[#FFBF00]" />
                    <span>Connexion</span>
                  </Link>
                  <Link
                    href="/login?tab=register"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#FFBF00] text-[#0B0B0B] hover:bg-[#E5AB00] transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>S'inscrire</span>
                  </Link>
                </>
              ) : (
                <>
                  <div className="px-3 py-2 border-b border-[#222222]">
                    <p className="text-xs font-bold text-white truncate">{user?.fullName || "Utilisateur"}</p>
                    <p className="text-[10px] text-[#757575] truncate">{user?.email}</p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[#B8B8B8] hover:text-white hover:bg-[#1E1E1E] transition-colors"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Mon Profil</span>
                  </Link>
                  {hasConsole && (
                    <Link
                      href={landing}
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[#FFBF00] hover:bg-[#1E1E1E] transition-colors font-medium"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Console d&apos;administration</span>
                    </Link>
                  )}
                  {isCreator && (
                    <Link
                      href="/studio"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[#FFBF00] hover:bg-[#1E1E1E] transition-colors font-medium"
                    >
                      <Radio className="w-3.5 h-3.5" />
                      <span>Espace Créateurs</span>
                    </Link>
                  )}
                  <Link
                    href="/library"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[#B8B8B8] hover:text-white hover:bg-[#1E1E1E] transition-colors"
                  >
                    <span>Ma Bibliothèque</span>
                  </Link>
                  <div className="pt-1 border-t border-[#222222]">
                    <button
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-red-400 hover:bg-[#1E1E1E] transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Se déconnecter</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
