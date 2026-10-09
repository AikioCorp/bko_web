"use client";
import { API_BASE_URL } from "@/lib/api";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface SearchSuggestionsDropdownProps {
  query: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectResult?: () => void;
}

export const SearchSuggestionsDropdown: React.FC<SearchSuggestionsDropdownProps> = ({
  query,
  isOpen,
  onClose,
  onSelectResult,
}) => {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 1. Debounced fetch of search suggestions (GET /api/v1/search/suggestions?q=)
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults(null);
      setLoading(false);
      setSelectedIndex(-1);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/search/suggestions?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (json.success) {
          setResults(json.data);
          setSelectedIndex(-1);
        }
      } catch (e) {
        console.error("Erreur de rÃ©cupÃ©ration des suggestions de recherche:", e);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Extract items
  const podcasts = results?.podcasts?.slice(0, 3) || [];
  const episodes = results?.episodes?.slice(0, 3) || [];
  const people = results?.people?.slice(0, 2) || [];
  const topics = results?.topics?.slice(0, 2) || [];

  // Flattened list for keyboard navigation
  const navigationItems: Array<{ type: string; label: string; url: string }> = [
    ...podcasts.map((p: any) => ({ type: "podcast", label: p.name, url: `/podcasts/${p.slug}` })),
    ...episodes.map((ep: any) => ({
      type: "episode",
      label: ep.title,
      url: `/podcasts/${ep.podcast?.slug || "voix-de-bamako"}/episodes/${ep.slug}`,
    })),
    ...people.map((person: any) => ({ type: "person", label: person.name, url: `/people/${person.slug}` })),
    ...topics.map((t: any) => ({ type: "topic", label: t.name, url: `/topics/${t.slug}` })),
  ];

  // Bottom action index = navigationItems.length
  const totalNavCount = navigationItems.length + (query.trim().length >= 2 ? 1 : 0);

  // 2. Keyboard Navigation Listener (ArrowDown, ArrowUp, Enter, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || totalNavCount === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % totalNavCount);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + totalNavCount) % totalNavCount);
      } else if (e.key === "Enter") {
        if (selectedIndex >= 0 && selectedIndex < navigationItems.length) {
          e.preventDefault();
          handleSelect(navigationItems[selectedIndex].url);
        } else if (selectedIndex === navigationItems.length) {
          e.preventDefault();
          handleSelect(`/search?q=${encodeURIComponent(query)}`);
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, totalNavCount, navigationItems, query]);

  // Clic ExtÃ©rieur
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen, onClose]);

  if (!isOpen || (!query.trim() && !results)) return null;

  const handleSelect = (url: string) => {
    router.push(url);
    if (onSelectResult) onSelectResult();
    onClose();
  };

  let globalIndexCounter = 0;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#161B22] border border-[#30363D] rounded-xl shadow-2xl overflow-hidden text-xs text-[#F0F6FC] animate-fade-in max-h-[70vh] overflow-y-auto"
    >
      {loading && (
        <div className="p-3 text-center text-[#8B949E] flex items-center justify-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full border-2 border-[#E6B009] border-t-transparent animate-spin" />
          <span>Recherche en cours...</span>
        </div>
      )}

      {!loading && navigationItems.length === 0 && query.length >= 2 && (
        <div className="p-4 text-center text-[#8B949E]">
          Aucun rÃ©sultat direct pour Â« <span className="text-[#F0F6FC]">{query}</span> Â»
        </div>
      )}

      {!loading && navigationItems.length > 0 && (
        <div className="divide-y divide-[#21262D]">
          {/* Section Podcasts */}
          {podcasts.length > 0 && (
            <div className="p-2 space-y-1">
              <span className="px-2 text-[10px] font-bold text-[#E6B009] uppercase tracking-wider">Podcasts</span>
              {podcasts.map((p: any) => {
                const itemIdx = globalIndexCounter++;
                const isSelected = selectedIndex === itemIdx;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelect(`/podcasts/${p.slug}`)}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[#1F242D] border-l-2 border-[#E6B009] text-white"
                        : "hover:bg-[#1F242D] text-[#F0F6FC]"
                    }`}
                  >
                    <div className="relative w-8 h-8 rounded overflow-hidden flex-shrink-0 bg-[#0B0F17]">
                      <Image src={p.cover || "/brand/favicon.png"} alt={p.name} fill className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="font-bold truncate">{p.name}</h5>
                      <p className="text-[10px] text-[#8B949E] truncate">{p.organization?.name || "Bko Podcast"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Section Ã‰pisodes */}
          {episodes.length > 0 && (
            <div className="p-2 space-y-1">
              <span className="px-2 text-[10px] font-bold text-[#E6B009] uppercase tracking-wider">Ã‰pisodes</span>
              {episodes.map((ep: any) => {
                const itemIdx = globalIndexCounter++;
                const isSelected = selectedIndex === itemIdx;
                return (
                  <div
                    key={ep.id}
                    onClick={() =>
                      handleSelect(`/podcasts/${ep.podcast?.slug || "voix-de-bamako"}/episodes/${ep.slug}`)
                    }
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[#1F242D] border-l-2 border-[#E6B009] text-white"
                        : "hover:bg-[#1F242D] text-[#F0F6FC]"
                    }`}
                  >
                    <span className="text-[#E6B009] text-sm">â–¶</span>
                    <div className="min-w-0 flex-1">
                      <h5 className="font-semibold truncate">{ep.title}</h5>
                      <p className="text-[10px] text-[#8B949E] truncate">{ep.podcast?.name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Section Personnes */}
          {people.length > 0 && (
            <div className="p-2 space-y-1">
              <span className="px-2 text-[10px] font-bold text-[#E6B009] uppercase tracking-wider">Personnes</span>
              {people.map((person: any) => {
                const itemIdx = globalIndexCounter++;
                const isSelected = selectedIndex === itemIdx;
                return (
                  <div
                    key={person.id}
                    onClick={() => handleSelect(`/people/${person.slug}`)}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[#1F242D] border-l-2 border-[#E6B009] text-white"
                        : "hover:bg-[#1F242D] text-[#F0F6FC]"
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-[#E6B009]/20 text-[#E6B009] flex items-center justify-center font-bold text-[10px]">
                      {person.name[0]}
                    </div>
                    <span className="font-semibold truncate">{person.name}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Section Topics / Sujets (NOUVEAU - Max 2 suggestions) */}
          {topics.length > 0 && (
            <div className="p-2 space-y-1">
              <span className="px-2 text-[10px] font-bold text-[#E6B009] uppercase tracking-wider">Sujets</span>
              {topics.map((t: any) => {
                const itemIdx = globalIndexCounter++;
                const isSelected = selectedIndex === itemIdx;
                return (
                  <div
                    key={t.id}
                    onClick={() => handleSelect(`/topics/${t.slug}`)}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[#1F242D] border-l-2 border-[#E6B009] text-white"
                        : "hover:bg-[#1F242D] text-[#F0F6FC]"
                    }`}
                  >
                    <span className="text-[#E6B009] font-bold text-xs">#</span>
                    <span className="font-semibold truncate">{t.name}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom Action Row: Voir tous les rÃ©sultats */}
          {(() => {
            const itemIdx = globalIndexCounter++;
            const isSelected = selectedIndex === itemIdx;
            return (
              <div
                onClick={() => handleSelect(`/search?q=${encodeURIComponent(query)}`)}
                className={`p-3 text-center text-xs font-bold text-[#E6B009] cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
                  isSelected
                    ? "bg-[#1F242D] border-l-2 border-[#E6B009]"
                    : "bg-[#1F242D]/50 hover:bg-[#1F242D]"
                }`}
              >
                <span>Voir tous les rÃ©sultats pour Â« {query} Â»</span>
                <span>â†’</span>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

