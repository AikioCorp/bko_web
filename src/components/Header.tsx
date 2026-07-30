"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BkoLogo } from "./ui/BkoLogo";
import { SearchSuggestionsDropdown } from "./search/SearchSuggestionsDropdown";

export const Header: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("bko_access_token");
      setIsLoggedIn(!!token);
    }
  }, [pathname]);

  if (pathname.startsWith("/admin") || pathname.startsWith("/studio")) {
    return null;
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsDropdownOpen(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsDropdownOpen(false);
    }
  };

  const navLinks = [
    { label: "Accueil", href: "/" },
    { label: "Explorer", href: "/explore" },
    { label: "Podcasts", href: "/podcasts" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0B0F17]/85 backdrop-blur-md border-b border-[#161B22] transition-colors">
      <div className="bko-container h-16 flex items-center justify-between gap-6">
        {/* Logo & Navigation Minimaliste */}
        <div className="flex items-center gap-8 min-w-0">
          <BkoLogo size="md" />

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-xs font-semibold transition-colors ${
                    isActive ? "text-[#E6B009]" : "text-[#8B949E] hover:text-[#F0F6FC]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Barre de Recherche Globale Inline (Desktop) */}
        <div ref={inputContainerRef} className="relative flex-1 max-w-md hidden sm:block">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            {/* Fine SVG Search Icon */}
            <svg
              className="absolute left-3.5 w-4 h-4 text-[#8B949E] pointer-events-none"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="Rechercher un podcast, un épisode, une personne..."
              className="w-full bg-[#161B22]/80 border border-[#21262D] focus:border-[#30363D] text-[#F0F6FC] placeholder-[#6E7681] text-xs rounded-xl py-2 pl-9 pr-4 outline-none transition-all"
            />
          </form>

          {/* Suggestions Dropdown */}
          <SearchSuggestionsDropdown
            query={searchQuery}
            isOpen={isDropdownOpen && searchQuery.trim().length >= 2}
            onClose={() => setIsDropdownOpen(false)}
            onSelectResult={() => setIsDropdownOpen(false)}
          />
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          <Link href="/search" className="sm:hidden p-2 text-[#8B949E] hover:text-[#F0F6FC]" aria-label="Recherche">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </Link>

          {isLoggedIn ? (
            <>
              <Link href="/library" className="hidden sm:inline-block text-xs font-semibold text-[#8B949E] hover:text-[#F0F6FC] transition-colors">
                Bibliothèque
              </Link>
              <Link href="/profile">
                <div className="w-7 h-7 rounded-full bg-[#E6B009] text-[#0B0F17] font-bold flex items-center justify-center text-xs hover:opacity-90 transition-opacity">
                  U
                </div>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-xs font-semibold text-[#8B949E] hover:text-[#F0F6FC] transition-colors">
                Connexion
              </Link>
              <Link
                href="/register"
                className="hidden sm:inline-block px-3.5 py-1.5 bg-[#E6B009] text-[#0B0F17] font-extrabold text-xs rounded-xl hover:bg-[#F5B82E] transition-colors"
              >
                S'inscrire
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
