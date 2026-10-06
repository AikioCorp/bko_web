"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { gsap } from "gsap";
import { Play, Plus, Headphones, BarChart3, Clock, AlertCircle, Mic, Loader2, Radio } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchApi } from "@/lib/api";

const fetcher = (url: string) => fetchApi(url).then(res => res.data);

export default function StudioDashboardPage() {
  const pageRef = useRef<HTMLDivElement>(null);

  // 1. On récupère les podcasts du créateur
  const { data: podcastsData, isLoading: isLoadingPodcasts } = useSWR("/creator/podcasts", fetcher);
  const podcasts = podcastsData?.items || [];
  const hasPodcast = podcasts.length > 0;
  
  // 2. Si le créateur a un podcast, on récupère ses épisodes pour le dashboard (on prend le 1er podcast)
  const firstPodcastId = hasPodcast ? podcasts[0].id : null;
  const { data: episodesData, isLoading: isLoadingEpisodes } = useSWR(
    firstPodcastId ? `/creator/podcasts/${firstPodcastId}/episodes` : null, 
    fetcher
  );
  
  const episodes = episodesData?.items || [];
  const totalPlays = podcasts.reduce((acc: number, p: any) => acc + (p._count?.plays || 0), 0);

  useEffect(() => {
    if (pageRef.current && !isLoadingPodcasts) {
      gsap.fromTo(
        pageRef.current.children,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: "power2.out" }
      );
    }
  }, [isLoadingPodcasts, hasPodcast]);

  if (isLoadingPodcasts) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FFBF00] animate-spin" />
      </div>
    );
  }

  // ÉTAT VIDE : Le créateur n'a pas encore de podcast
  if (!hasPodcast) {
    return (
      <div ref={pageRef} className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="w-24 h-24 bg-[#1A1A1A] rounded-full flex items-center justify-center border border-[#2A2A2A]">
          <Mic className="w-10 h-10 text-[#FFBF00]" />
        </div>
        <div className="space-y-2 max-w-md">
          <h1 className="text-3xl font-extrabold text-white">Bienvenue dans votre Studio</h1>
          <p className="text-[#888888] text-base leading-relaxed">
            Il semble que vous n'ayez pas encore de podcast. Créez-en un maintenant pour commencer à publier vos épisodes et bâtir votre audience.
          </p>
        </div>
        <div className="flex gap-4 pt-4">
          <Button className="bg-[#1C1C1C] hover:bg-[#2A2A2A] text-white border border-[#333]" asChild>
            <Link href="/studio/podcasts/new">Importer via RSS</Link>
          </Button>
          <Button className="bg-[#FFBF00] hover:bg-[#E5A800] text-[#0B0B0B] font-bold" asChild>
            <Link href="/studio/podcasts/new">
              <Plus className="w-4 h-4 mr-2" /> Créer un podcast
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // DASHBOARD ACTIF : Le créateur a des podcasts
  return (
    <div ref={pageRef} className="space-y-8 pb-12 w-full">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#222] pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">
            Vue d'ensemble
          </h1>
          <p className="text-[#888888]">
            Bienvenue dans votre espace créateur. Voici un résumé de votre activité.
          </p>
        </div>
        <div className="flex gap-3">
          <Button className="bg-[#FFBF00] hover:bg-[#E5A800] text-[#0B0B0B] font-bold" asChild>
            <Link href="/studio/episodes/new">
              <Plus className="w-4 h-4 mr-2" /> Nouvel Épisode
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#111] border-[#222] text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#888] flex items-center justify-between">
              Écoutes totales
              <Headphones className="w-4 h-4 text-[#FFBF00]" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalPlays.toLocaleString()}</div>
            <p className="text-xs text-[#666] mt-1">+0% depuis le mois dernier</p>
          </CardContent>
        </Card>

        <Card className="bg-[#111] border-[#222] text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#888] flex items-center justify-between">
              Podcasts actifs
              <Radio className="w-4 h-4 text-purple-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{podcasts.length}</div>
            <p className="text-xs text-[#666] mt-1">Vos émissions en ligne</p>
          </CardContent>
        </Card>

        <Card className="bg-[#111] border-[#222] text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#888] flex items-center justify-between">
              Épisodes publiés
              <Play className="w-4 h-4 text-green-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {podcasts.reduce((acc: number, p: any) => acc + (p._count?.episodes || 0), 0)}
            </div>
            <p className="text-xs text-[#666] mt-1">Toutes émissions confondues</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-[#111] border-[#222] text-white">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              Épisodes récents ({podcasts[0]?.name})
              <Button variant="ghost" size="sm" className="text-[#888] hover:text-white" asChild>
                <Link href="/studio/episodes">Voir tout</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingEpisodes ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-[#FFBF00] animate-spin" /></div>
            ) : episodes.length === 0 ? (
              <div className="text-center py-8 text-[#888]">
                Vous n'avez publié aucun épisode pour cette émission.
              </div>
            ) : (
              <div className="space-y-4">
                {episodes.slice(0, 5).map((episode: any) => (
                  <div key={episode.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-[#1A1A1A] transition-colors border border-transparent hover:border-[#333]">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#222] rounded flex items-center justify-center">
                        <Play className="w-4 h-4 text-[#888]" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{episode.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-[#222] text-xs hover:bg-[#333] border-none text-[#AAA]">
                            {episode.status === 'PUBLISHED' ? 'Publié' : episode.status === 'DRAFT' ? 'Brouillon' : 'En attente'}
                          </Badge>
                          <span className="text-xs text-[#666] flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(episode.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className="text-sm font-bold text-white">{episode._count?.plays || 0}</div>
                      <div className="text-xs text-[#888]">écoutes</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#111] border-[#222] text-white">
          <CardHeader>
            <CardTitle className="text-lg">Tutoriels & Astuces</CardTitle>
            <CardDescription className="text-[#888]">Pour améliorer votre podcast</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                <a href="#" className="block p-4 rounded-lg border border-[#222] bg-[#161616] hover:border-[#444] transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-blue-400" />
                    <h4 className="font-semibold text-sm">Améliorer la qualité audio</h4>
                  </div>
                  <p className="text-xs text-[#888]">Découvrez nos conseils pour enregistrer avec un son professionnel depuis chez vous.</p>
                </a>
                
                <a href="#" className="block p-4 rounded-lg border border-[#222] bg-[#161616] hover:border-[#444] transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-purple-400" />
                    <h4 className="font-semibold text-sm">Comprendre l'algorithme</h4>
                  </div>
                  <p className="text-xs text-[#888]">Comment les auditeurs découvrent-ils de nouveaux contenus sur Bamako Podcast ?</p>
                </a>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
