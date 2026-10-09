"use client";

import React from "react";
import useSWR from "swr";
import Link from "next/link";
import { Plus, Podcast as PodcastIcon, Rss, ExternalLink, Settings, Loader2, Image as ImageIcon } from "lucide-react";

import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const fetcher = (url: string) => fetchApi(url).then(res => res.data);

export default function StudioPodcastsPage() {
  const { data, error, isLoading } = useSWR("/creator/podcasts", fetcher);
  const podcasts = data?.items || [];

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#222] pb-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <PodcastIcon className="w-7 h-7 text-[#FFBF00]" />
            Mes Podcasts
          </h1>
          <p className="text-[#888888]">
            GÃ©rez vos Ã©missions, modifiez leurs informations et consultez leurs statistiques.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-[#111] border-[#333] text-white hover:bg-[#222]" asChild>
            <Link href="/studio/podcasts/new">
              <Rss className="w-4 h-4 mr-2 text-orange-400" />
              Connecter un flux RSS
            </Link>
          </Button>
          <Button className="bg-[#FFBF00] hover:bg-[#E5A800] text-[#0B0B0B] font-bold" asChild>
            <Link href="/studio/podcasts/new">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Ã‰mission
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#FFBF00] animate-spin" />
        </div>
      ) : error ? (
        <div className="h-64 flex flex-col items-center justify-center text-[#888]">
          <p className="text-red-500 mb-2">Erreur lors du chargement de vos podcasts.</p>
        </div>
      ) : podcasts.length === 0 ? (
        <div className="border-2 border-dashed border-[#333] rounded-xl p-12 text-center flex flex-col items-center bg-[#0E0E0E]">
          <div className="w-16 h-16 bg-[#222] rounded-full flex items-center justify-center mb-4">
            <PodcastIcon className="w-8 h-8 text-[#888]" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Aucun podcast</h3>
          <p className="text-[#888] max-w-md mb-6">
            Vous n'avez pas encore crÃ©Ã© ou revendiquÃ© de podcast sur la plateforme. Commencez par crÃ©er votre premiÃ¨re Ã©mission !
          </p>
          <Button className="bg-[#FFBF00] hover:bg-[#E5A800] text-[#0B0B0B] font-bold" asChild>
            <Link href="/studio/podcasts/new">CrÃ©er un podcast</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {podcasts.map((podcast: any) => (
            <Card key={podcast.id} className="bg-[#111] border-[#222] text-white hover:border-[#444] transition-all group overflow-hidden flex flex-col">
              <CardContent className="p-0 flex-1 flex flex-col">
                <div className="p-5 flex gap-4">
                  {podcast.coverImageUrl ? (
                    <img src={podcast.coverImageUrl} alt={podcast.name} className="w-24 h-24 rounded-lg object-cover bg-[#222] border border-[#333] shrink-0" />
                  ) : (
                    <div className="w-24 h-24 rounded-lg bg-[#222] flex items-center justify-center border border-[#333] shrink-0">
                      <ImageIcon className="w-8 h-8 text-[#555]" />
                    </div>
                  )}
                  <div className="flex flex-col overflow-hidden">
                    <h3 className="text-lg font-bold text-white truncate group-hover:text-[#FFBF00] transition-colors" title={podcast.name}>
                      {podcast.name}
                    </h3>
                    <p className="text-sm text-[#888] line-clamp-2 mt-1 mb-2">
                      {podcast.description || "Aucune description"}
                    </p>
                    <div className="mt-auto flex flex-wrap gap-2">
                      <Badge className="bg-[#222] hover:bg-[#333] text-[#AAA] border-none">
                        {podcast._count?.episodes || 0} Ã©pisodes
                      </Badge>
                      {podcast.status === "PUBLISHED" && (
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20">En ligne</Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-[#222] bg-[#161616] p-3 flex items-center justify-between mt-auto">
                  <Button variant="ghost" size="sm" className="text-[#888] hover:text-white hover:bg-[#2A2A2A]" asChild>
                    <a href={`/podcasts/${podcast.id}`} target="_blank" rel="noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      AperÃ§u
                    </a>
                  </Button>
                  <Button variant="ghost" size="sm" className="text-[#FFBF00] hover:text-[#FFBF00] hover:bg-[#FFBF00]/10" asChild>
                    <Link href={`/studio/podcasts/${podcast.id}`}>
                      <Settings className="w-4 h-4 mr-2" />
                      GÃ©rer
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

