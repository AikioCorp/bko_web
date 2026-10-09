"use client";
import { API_BASE_URL } from "@/lib/api";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/search/suggestions?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (json.success) {
          setResults(json.data);
        }
      } catch (e) {
        console.error("Search suggestion error:", e);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0F17]/80 backdrop-blur-md flex items-start justify-center pt-16 px-4 animate-fade-in">
      <div className="w-full max-w-2xl bg-[#161B22] border border-[#30363D] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 px-4 py-3.5 border-b border-[#21262D]">
          <span className="text-[#8B949E] text-lg">ðŸ”</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un podcast, un Ã©pisode, une personne, un sujet..."
            className="flex-1 bg-transparent text-[#F0F6FC] placeholder-[#6E7681] text-base outline-none"
            autoFocus
          />
          {loading && <span className="text-xs text-[#E6B009]">Recherche...</span>}
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 text-xs text-[#8B949E] bg-[#1F242D] border border-[#30363D] rounded hover:text-[#F0F6FC]"
          >
            ESC
          </button>
        </form>

        {/* Suggestions & Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!query && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-[#8B949E] uppercase tracking-wider">Suggestions rapides</h4>
              <div className="flex flex-wrap gap-2">
                {["Entrepreneuriat Mali", "Culture & SociÃ©tÃ©", "Tech & Innovation", "Musique Bambara"].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setQuery(s);
                    }}
                    className="px-3 py-1.5 text-xs bg-[#1F242D] text-[#F0F6FC] rounded-lg border border-[#21262D] hover:border-[#E6B009]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {results && (
            <div className="space-y-4">
              {results.podcasts && results.podcasts.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-[#E6B009] mb-2 uppercase">Podcasts</h4>
                  <div className="space-y-1">
                    {results.podcasts.map((p: any) => (
                      <Link
                        key={p.id}
                        href={`/podcasts/${p.slug}`}
                        onClick={onClose}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1F242D] text-sm text-[#F0F6FC]"
                      >
                        <span className="font-semibold">{p.name}</span>
                        <span className="text-xs text-[#8B949E]">Podcast</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

