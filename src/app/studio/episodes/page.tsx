"use client";

import React, { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { 
  Plus, 
  Radio, 
  Search, 
  Clock, 
  Calendar, 
  Headphones, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  FileEdit,
  ExternalLink,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/api";

const fetcher = (url: string) => fetchApi(url).then((res) => {
  if (!res.success) throw new Error(res.message);
  return res.data;
});

export default function StudioEpisodesPage() {
  const [selectedPodcastId, setSelectedPodcastId] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const queryParams = new URLSearchParams();
  if (selectedPodcastId !== "ALL") queryParams.append("podcastId", selectedPodcastId);
  if (selectedStatus !== "ALL") queryParams.append("status", selectedStatus);
  if (searchQuery.trim()) queryParams.append("search", searchQuery.trim());

  const episodesUrl = `/creator/episodes${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
  const { data: episodesData, isLoading: isLoadingEpisodes, mutate } = useSWR(episodesUrl, fetcher);
  const { data: podcastsData } = useSWR("/creator/podcasts", fetcher);

  const episodes = Array.isArray(episodesData) ? episodesData : [];
  const podcasts = Array.isArray(podcastsData) ? podcastsData : (podcastsData?.items || []);

  const statusLabels: Record<string, { label: string; badgeCls: string }> = {
    PUBLISHED: { label: "PubliÃ©", badgeCls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    SCHEDULED: { label: "ProgrammÃ©", badgeCls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    DRAFT: { label: "Brouillon", badgeCls: "bg-[#262626] text-[#A3A3A3] border-[#333333]" },
    PENDING_REVIEW: { label: "En attente", badgeCls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    ARCHIVED: { label: "ArchivÃ©", badgeCls: "bg-red-500/10 text-red-400 border-red-500/20" },
  };

  return (
    <div className="space-y-6 w-full pb-16">
      {/* En-tÃªte */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#222222] pb-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Radio className="w-7 h-7 text-[#FFBF00]" />
            Mes Ã‰pisodes
          </h1>
          <p className="text-[#888888]">
            GÃ©rez vos Ã©pisodes publiÃ©s, vos brouillons en cours et vos programmations.
          </p>
        </div>
        <Button className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold" asChild>
          <Link href="/studio/episodes/new">
            <Plus className="w-4 h-4 mr-2" />
            Nouvel Ã‰pisode
          </Link>
        </Button>
      </div>

      {/* Barre de filtres et recherche */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          {/* Recherche */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#757575] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par titre ou mot-clÃ©..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:border-[#FFBF00] outline-none"
            />
          </div>

          {/* Filtre Podcast */}
          <div className="sm:w-56">
            <select
              value={selectedPodcastId}
              onChange={(e) => setSelectedPodcastId(e.target.value)}
              className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:border-[#FFBF00] outline-none"
            >
              <option value="ALL">Tous les podcasts</option>
              {podcasts.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filtres de statut */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "ALL", label: "Tous" },
            { id: "PUBLISHED", label: "PubliÃ©s" },
            { id: "SCHEDULED", label: "ProgrammÃ©s" },
            { id: "DRAFT", label: "Brouillons" },
            { id: "PENDING_REVIEW", label: "En revue" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                selectedStatus === tab.id
                  ? "bg-[#FFBF00] text-[#0B0B0B]"
                  : "bg-[#1E1E1E] text-[#A3A3A3] hover:text-white hover:bg-[#2A2A2A]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu principal */}
      {isLoadingEpisodes ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-[#FFBF00] animate-spin" />
          <p className="text-sm text-[#757575]">Chargement de vos Ã©pisodes...</p>
        </div>
      ) : episodes.length === 0 ? (
        <div className="border border-[#262626] rounded-xl p-12 text-center flex flex-col items-center bg-[#141414]">
          <div className="w-16 h-16 bg-[#1F1F1F] rounded-full flex items-center justify-center mb-4">
            <Radio className="w-8 h-8 text-[#757575]" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            {searchQuery || selectedStatus !== "ALL" || selectedPodcastId !== "ALL"
              ? "Aucun Ã©pisode ne correspond Ã  vos filtres"
              : "Aucun Ã©pisode pour le moment"}
          </h3>
          <p className="text-[#888888] max-w-md mb-6 text-sm">
            {searchQuery || selectedStatus !== "ALL" || selectedPodcastId !== "ALL"
              ? "Essayez de modifier votre recherche ou de rÃ©initialiser vos filtres."
              : "Commencez dÃ¨s aujourd'hui en ajoutant votre premier Ã©pisode dans le Creator Studio."}
          </p>
          <Button className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold" asChild>
            <Link href="/studio/episodes/new">
              <Plus className="w-4 h-4 mr-2" />
              CrÃ©er un Ã©pisode
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {episodes.map((ep: any) => {
            const statusConfig = statusLabels[ep.status] || { label: ep.status, badgeCls: "bg-[#262626] text-white" };
            const audioSource = ep.mediaSources?.find((m: any) => m.type === "AUDIO");
            const isProcessing = audioSource?.mediaAsset?.status === "PROCESSING" || audioSource?.mediaAsset?.status === "UPLOADING";
            const durationMin = ep.durationSeconds ? Math.round(ep.durationSeconds / 60) : null;
            const coverImage = ep.cover || ep.podcast?.cover || "https://placehold.co/200x200/171717/333333?text=BKO";

            return (
              <div
                key={ep.id}
                className="bg-[#141414] border border-[#262626] hover:border-[#3A3A3A] transition-all rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-16 h-16 rounded-lg bg-[#222222] overflow-hidden flex-shrink-0 relative">
                    <img
                      src={coverImage}
                      alt={ep.title}
                      className="w-full h-full object-cover"
                    />
                    {isProcessing && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-[#FFBF00] animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-bold text-[#FFBF00] uppercase tracking-wide">
                        {ep.podcast?.name || "Podcast"}
                      </span>
                      {ep.season && (
                        <span className="text-xs text-[#757575]">
                          â€¢ S{ep.season.number}{ep.episodeNumber ? `E${ep.episodeNumber}` : ""}
                        </span>
                      )}
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusConfig.badgeCls}`}>
                        {statusConfig.label}
                      </span>
                      {isProcessing && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-blue-500/10 text-blue-400 border-blue-500/20 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Audio en cours
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white truncate max-w-xl">
                      {ep.title}
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-[#757575] mt-1">
                      {durationMin ? (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {durationMin} min
                        </span>
                      ) : null}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(ep.publishedAt || ep.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      {ep.mediaSources?.length > 0 && (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> MÃ©dia attachÃ©
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#2A2A2A] text-white hover:bg-[#222222] text-xs h-9"
                    asChild
                  >
                    <Link href={`/studio/episodes/${ep.id}/edit`}>
                      <FileEdit className="w-3.5 h-3.5 mr-1.5" />
                      {ep.status === "DRAFT" ? "Reprendre" : "Modifier"}
                    </Link>
                  </Button>

                  {ep.status === "PUBLISHED" && ep.podcast?.slug && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[#888888] hover:text-white hover:bg-[#222222] text-xs h-9 px-2"
                      asChild
                    >
                      <Link
                        href={`/podcasts/${ep.podcast.slug}/episodes/${ep.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Voir la page publique"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


