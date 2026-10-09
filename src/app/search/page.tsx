"use client";
import { API_BASE_URL } from "@/lib/api";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SearchBar } from "../../components/search/SearchBar";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingSkeleton } from "../../components/ui/LoadingSkeleton";
import { usePlayerStore, PlayerEpisode } from "../../store/playerStore";
import { Play, Pause, User, Mic, Tag, MessageSquare, Clock, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { playEpisode, currentEpisode, isPlaying, togglePlay } = usePlayerStore();

  useEffect(() => {
    if (!query.trim()) return;

    setLoading(true);
    fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setResults(json.data);
      })
      .catch((err) => console.error("Erreur Search API:", err))
      .finally(() => setLoading(false));
  }, [query]);

  const totalResults =
    (results?.podcasts?.length || 0) +
    (results?.episodes?.length || 0) +
    (results?.passages?.length || 0) +
    (results?.people?.length || 0) +
    (results?.topics?.length || 0);

  return (
    <div className="bko-container py-8 space-y-8 animate-fade-in">
      {/* Central Search Bar Input */}
      <div className="max-w-2xl mx-auto space-y-4">
        <SearchBar initialQuery={query} />
        {query && !loading && (
          <p className="text-xs text-center text-[#8B949E]">
            {totalResults} rÃ©sultat(s) trouvÃ©(s) pour <span className="text-[#E6B009] font-bold">"{query}"</span>
          </p>
        )}
      </div>

      {loading && <LoadingSkeleton count={3} />}

      {!loading && query && totalResults === 0 && <EmptyState query={query} />}

      {!loading && results && totalResults > 0 && (
        <div className="space-y-10">
          {/* Section Passages & Extraits de Conversations (Verticale 8) */}
          {results.passages?.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-[#E6B009]">
                <MessageSquare className="w-5 h-5" />
                <h2 className="text-xl font-black text-[#F0F6FC]">
                  Passages & Extraits Audio ({results.passages.length})
                </h2>
              </div>
              <p className="text-xs text-[#8B949E]">
                L'expression recherchÃ©e a Ã©tÃ© entendue prÃ©cisÃ©ment Ã  ces moments clÃ©s dans les enregistrements :
              </p>

              <div className="space-y-3">
                {results.passages.map((p: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-[#141414] border border-[#242424] hover:border-[#FFBF00]/50 rounded-2xl p-5 space-y-3 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {p.cover && (
                          <img
                            src={p.cover}
                            alt={p.podcastName}
                            className="w-10 h-10 rounded-lg object-cover border border-[#242424]"
                          />
                        )}
                        <div>
                          <span className="text-[10px] text-[#FFBF00] font-bold uppercase">{p.podcastName}</span>
                          <h4 className="font-extrabold text-white text-sm">{p.episodeTitle}</h4>
                        </div>
                      </div>

                      <Link
                        href={p.deepLinkUrl}
                        className="bg-[#1C180E] text-[#FFBF00] border border-[#FFBF00]/30 hover:bg-[#FFBF00] hover:text-[#0B0B0B] px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Ã‰couter Ã  {p.formattedTime}</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Link>
                    </div>

                    <div className="bg-[#0E0E0E] p-3 rounded-xl border border-[#242424] text-xs text-white italic border-l-4 border-l-[#FFBF00]">
                      <span className="font-bold text-[#FFBF00] not-italic pr-2">"{p.speakerLabel}" :</span>
                      "{p.text}"
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section Podcasts */}
          {results.podcasts?.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-[#F0F6FC] flex items-center gap-2">
                <Mic className="w-5 h-5 text-[#E6B009]" />
                <span>Podcasts ({results.podcasts.length})</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {results.podcasts.map((p: any) => (
                  <Link
                    key={p.id}
                    href={`/podcasts/${p.slug}`}
                    className="bg-[#141414] border border-[#242424] rounded-2xl p-4 flex items-center gap-4 hover:border-[#FFBF00] transition-colors"
                  >
                    <img src={p.cover} alt={p.name} className="w-14 h-14 rounded-xl object-cover border border-[#242424]" />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-white text-sm truncate">{p.name}</h4>
                      <p className="text-xs text-[#8B949E] truncate">{p.country?.name || "Mali"} â€¢ {p.primaryLanguage?.name || "Bamanankan"}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Section Ã‰pisodes */}
          {results.episodes?.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-[#F0F6FC] flex items-center gap-2">
                <Play className="w-5 h-5 text-[#E6B009]" />
                <span>Ã‰pisodes ({results.episodes.length})</span>
              </h2>

              <div className="space-y-3">
                {results.episodes.map((ep: any) => {
                  const playerEp: PlayerEpisode = {
                    id: ep.id,
                    slug: ep.slug,
                    title: ep.title,
                    cover: ep.cover || ep.podcast?.cover || "/brand/logo.webp",
                    durationSeconds: ep.durationSeconds,
                    podcast: {
                      slug: ep.podcast?.slug || "",
                      name: ep.podcast?.name || "",
                      cover: ep.podcast?.cover || "/brand/logo.webp",
                    },
                    mediaSources: ep.mediaSources || [],
                  };

                  return (
                    <div
                      key={ep.id}
                      className="bg-[#161B22] border border-[#21262D] rounded-2xl p-4 flex items-center justify-between hover:border-[#E6B009]/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={ep.cover || ep.podcast?.cover || "/brand/logo.webp"}
                          alt={ep.title}
                          className="w-12 h-12 rounded-xl object-cover border border-[#21262D]"
                        />
                        <div>
                          <h4 className="font-bold text-[#F0F6FC] text-sm">{ep.title}</h4>
                          <p className="text-xs text-[#E6B009]">{ep.podcast?.name}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => playEpisode(playerEp, "AUDIO")}
                        className="bg-[#E6B009] text-[#0B0F17] px-4 py-2 rounded-xl text-xs font-extrabold hover:bg-[#F5B82E] transition-colors flex items-center gap-1.5 shrink-0"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Ã‰couter</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Section Personnes */}
          {results.people?.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-[#F0F6FC] flex items-center gap-2">
                <User className="w-5 h-5 text-[#E6B009]" />
                <span>Personnes & HÃ´tes ({results.people.length})</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {results.people.map((person: any) => (
                  <div key={person.id} className="bg-[#161B22] border border-[#21262D] rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#E6B009]/20 text-[#E6B009] rounded-full flex items-center justify-center font-bold text-base border border-[#E6B009]/30">
                      {person.name[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-[#F0F6FC] text-sm">{person.name}</h4>
                      <p className="text-xs text-[#8B949E]">{person.city || "Bamako"}, {person.country?.name || "Mali"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-[#8B949E]">Chargement de la recherche...</div>}>
      <SearchContent />
    </Suspense>
  );
}

