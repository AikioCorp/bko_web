"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Plus, User, LogIn, UserPlus, LogOut, Radio, Menu, ShieldCheck, Bookmark, Smartphone } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { BkoLogo } from "./ui/BkoLogo";
import { NotificationBell } from "./NotificationBell";
import { UserDropdown } from "./UserDropdown";
import { useConsoleAccess } from "@/hooks/useConsoleAccess";
import { API_BASE_URL } from "@/lib/api";
import { AppDownloadModal } from "./modals/AppDownloadModal";

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
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
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

  const isSuperAdmin = Boolean(
    user?.roles?.some((r) => r.toUpperCase() === "SUPER_ADMIN")
  );
  const isAdmin = Boolean(
    isSuperAdmin || user?.roles?.some((r) => r.toUpperCase() === "ADMIN")
  );
  const isCreator =
    isAuthenticated &&
    Boolean(
      isAdmin ||
      user?.roles?.some((r) => ["CREATOR", "EDITOR"].includes(r.toUpperCase())) ||
      user?.permissions?.includes("publish:episodes")
    );
  const canAccessConsole = hasConsole || isAdmin;

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

      {/* Right Actions: App Mobile CTA + Publier (Creator Only) + Login Icon with Hover Popover */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Call-to-Action to download Mobile App */}
        <button
          onClick={() => setIsAppModalOpen(true)}
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#181818] hover:bg-[#222222] border border-[#2D2D2D] hover:border-[#FFBF00]/40 text-[#D4D4D4] hover:text-white text-xs font-semibold transition-all shadow-sm"
          title="Installer l'application mobile"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#FFBF00]" />
          <span>App Mobile</span>
        </button>

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

        {canAccessConsole && (
          <Link
            href="/admin/dashboard"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FFBF00] text-[#0B0B0B] hover:bg-[#E5AB00] text-xs font-bold transition-all shadow-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Administration</span>
          </Link>
        )}

        <NotificationBell />

        <UserDropdown />
      </div>

      <AppDownloadModal isOpen={isAppModalOpen} onClose={() => setIsAppModalOpen(false)} />
    </header>
  );
};
