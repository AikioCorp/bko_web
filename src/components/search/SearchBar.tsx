"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, Clock, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface SuggestionItem {
  id: string;
  title: string;
  type: string;
  url: string;
  image?: string | null;
}

export const SearchBar = ({ initialQuery = "" }: { initialQuery?: string }) => {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  // Charger l'historique local
  useEffect(() => {
    const saved = localStorage.getItem("bko_recent_searches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  // Détection de clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce Autocomplete
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/v1/search/suggestions?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (json.success) {
          setSuggestions(json.data);
        }
      } catch (err) {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("bko_recent_searches", JSON.stringify(updated));
  };

  const removeRecentSearch = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter((s) => s !== term);
    setRecentSearches(updated);
    localStorage.setItem("bko_recent_searches", JSON.stringify(updated));
  };

  const clearAllRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem("bko_recent_searches");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    saveRecentSearch(query.trim());
    setIsOpen(false);
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-xl mx-auto">
      <form onSubmit={handleSearchSubmit} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Rechercher un podcast, un épisode, Modibo Keita, Bamanankan..."
          className="w-full bg-[#121722] text-white border border-[#1E2638] focus:border-[#E5A93C] rounded-full py-3 pl-11 pr-10 text-sm outline-none transition shadow-inner placeholder-gray-500"
        />
        <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setSuggestions([]);
            }}
            className="absolute right-3.5 top-3.5 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Popover Autocomplétion & Historique */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#121722] border border-[#1E2638] rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-[#1E2638]">
          {/* Autocomplétion en direct */}
          {suggestions.length > 0 && (
            <div className="p-2 space-y-1">
              <p className="px-3 py-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Suggestions
              </p>
              {suggestions.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  onClick={() => {
                    saveRecentSearch(query);
                    setIsOpen(false);
                  }}
                  className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-[#1E2638] transition text-xs"
                >
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-8 h-8 rounded object-cover" />
                  ) : (
                    <div className="w-8 h-8 bg-[#E5A93C]/10 text-[#E5A93C] rounded flex items-center justify-center font-bold">
                      {item.type[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 truncate">
                    <span className="font-semibold text-white truncate block">{item.title}</span>
                    <span className="text-[10px] text-[#E5A93C] uppercase">{item.type}</span>
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* Historique des Recherches Récents */}
          {recentSearches.length > 0 && (
            <div className="p-3 space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1">
                  <Clock className="w-3 h-3 mr-1" /> Recherches récentes
                </span>
                <button
                  onClick={clearAllRecent}
                  className="text-[10px] text-gray-400 hover:text-red-400 transition"
                >
                  Effacer
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {recentSearches.map((term) => (
                  <span
                    key={term}
                    onClick={() => {
                      setQuery(term);
                      saveRecentSearch(term);
                      setIsOpen(false);
                      router.push(`/search?q=${encodeURIComponent(term)}`);
                    }}
                    className="inline-flex items-center space-x-1.5 bg-[#0A0D14] text-xs text-gray-300 px-3 py-1.5 rounded-full border border-[#1E2638] hover:border-[#E5A93C] cursor-pointer transition"
                  >
                    <span>{term}</span>
                    <X
                      className="w-3 h-3 text-gray-500 hover:text-white"
                      onClick={(e) => removeRecentSearch(term, e)}
                    />
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
