"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { studioApi, timeAgo } from "@/lib/studioApi";
import { Badge, Btn, Card, Empty, ErrorBanner, Loading, PageHeader, StatCard } from "@/components/admin/ui";
import { StatusBadge, ROLE_LABELS } from "@/components/studio/bits";

type Podcast = {
  id: string;
  name: string;
  cover: string;
  status: string;
  role: string;
  reviewNote?: string | null;
  country: { name: string };
  _count: { episodes: number; followers: number };
};
type Dashboard = {
  podcastsCount: number;
  episodesCount: number;
  totalFollowers: number;
  draftEpisodes: number;
  scheduledEpisodes: number;
  pendingReview: number;
  failedMedia: number;
  plays30d: number;
  rejected: { id: string; title: string; reviewNote: string; podcast: { id: string; name: string } }[];
  recentEpisodes: { id: string; title: string; status: string; updatedAt: string; podcast: { id: string; name: string } }[];
};

export default function StudioDashboardPage() {
  const [podcasts, setPodcasts] = useState<Podcast[] | null>(null);
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      // Sans profil créateur, l'espace studio n'a pas de sens : on oriente vers l'inscription créateur.
      try {
        await studioApi("/me/creator-profile");
      } catch (e: any) {
        if (/profil créateur/i.test(e.message)) {
          setNeedsProfile(true);
          return;
        }
        throw e;
      }
      const [p, d] = await Promise.all([studioApi<Podcast[]>("/creator/podcasts"), studioApi<Dashboard>("/creator/dashboard")]);
      setPodcasts(p);
      setDash(d);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (needsProfile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-2xl font-extrabold text-white">Devenez créateur sur Bamako Podcast</h1>
        <p className="text-sm text-gray-400">Créez votre profil créateur pour publier vos podcasts, par fichier audio ou par lien.</p>
        <Link href="/onboarding" className="inline-block bg-[#FFBF00] text-[#0B0B0B] font-bold text-sm px-5 py-2.5 rounded-lg">
          Créer mon profil créateur
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <PageHeader
        title="Studio créateur"
        subtitle="Créez vos émissions, ajoutez vos épisodes (fichier ou lien), programmez-les et suivez votre audience."
        actions={
          <Link href="/studio/podcasts/new" className="bg-[#FFBF00] text-[#0B0B0B] text-xs font-bold px-4 py-2.5 rounded-lg">
            Nouveau podcast
          </Link>
        }
      />
      {error && <ErrorBanner message={error} onRetry={load} />}
      {!podcasts && !error && <Loading />}

      {dash && (
        <>
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Podcasts" value={dash.podcastsCount} />
            <StatCard label="Épisodes publiés" value={dash.episodesCount} hint={`${dash.draftEpisodes} brouillon(s) • ${dash.scheduledEpisodes} programmé(s)`} />
            <StatCard label="Abonnés" value={dash.totalFollowers.toLocaleString("fr-FR")} />
            <StatCard label="Écoutes (30 j)" value={dash.plays30d.toLocaleString("fr-FR")} />
          </section>

          {(dash.rejected.length > 0 || dash.failedMedia > 0 || dash.pendingReview > 0) && (
            <section className="space-y-3">
              <h2 className="text-lg font-extrabold">À traiter</h2>
              {dash.pendingReview > 0 && (
                <div className="bg-[#FFBF00]/10 border border-[#FFBF00]/30 text-[#FFBF00] text-sm rounded-xl p-4">
                  {dash.pendingReview} épisode(s) en attente de validation par l&apos;équipe.
                </div>
              )}
              {dash.failedMedia > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl p-4">
                  {dash.failedMedia} fichier(s) n&apos;ont pas pu être traités : rouvrez l&apos;épisode concerné et renvoyez le fichier.
                </div>
              )}
              {dash.rejected.map((r) => (
                <Card key={r.id} className="p-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{r.title}</p>
                    <p className="text-xs text-gray-400">{r.podcast.name}</p>
                    <p className="text-sm text-red-300 mt-1">Motif du refus : {r.reviewNote}</p>
                  </div>
                  <Link href={`/studio/episodes/${r.id}/edit`}>
                    <Btn variant="primary">Corriger</Btn>
                  </Link>
                </Card>
              ))}
            </section>
          )}
        </>
      )}

      {podcasts && (
        <section className="space-y-3">
          <h2 className="text-lg font-extrabold">Mes podcasts</h2>
          {podcasts.length === 0 ? (
            <Card>
              <Empty>
                Vous n&apos;avez pas encore de podcast.{" "}
                <Link href="/studio/podcasts/new" className="text-[#FFBF00] font-bold">
                  Créer le premier
                </Link>
              </Empty>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {podcasts.map((p) => (
                <Card key={p.id} className="p-4 space-y-3">
                  <div className="flex gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.cover} alt="" className="w-16 h-16 rounded-lg object-cover bg-[#262626]" />
                    <div className="min-w-0 flex-1">
                      <Link href={`/studio/podcasts/${p.id}`} className="font-bold hover:text-[#FFBF00] line-clamp-2">
                        {p.name}
                      </Link>
                      <p className="text-xs text-gray-400">
                        {p.country.name} • {p._count.episodes} épisodes • {p._count.followers} abonnés
                      </p>
                      <div className="flex gap-1.5 mt-1.5">
                        <StatusBadge status={p.status} kind="podcast" />
                        <Badge>{ROLE_LABELS[p.role] ?? p.role}</Badge>
                      </div>
                    </div>
                  </div>
                  {p.reviewNote && p.status === "DRAFT" && <p className="text-xs text-red-300">Refusé : {p.reviewNote}</p>}
                  <div className="flex gap-2">
                    <Link href={`/studio/podcasts/${p.id}`}>
                      <Btn>Gérer</Btn>
                    </Link>
                    {p.role !== "ANALYST" && (
                      <Link href={`/studio/podcasts/${p.id}/episodes/new`}>
                        <Btn variant="primary">Ajouter un épisode</Btn>
                      </Link>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {dash && dash.recentEpisodes.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-extrabold">Activité récente</h2>
          <Card className="divide-y divide-[#262626]">
            {dash.recentEpisodes.map((e) => (
              <Link key={e.id} href={`/studio/episodes/${e.id}/edit`} className="p-4 flex items-center justify-between gap-4 hover:bg-[#1c1c1c]">
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{e.title}</p>
                  <p className="text-xs text-gray-400">
                    {e.podcast.name} • modifié {timeAgo(e.updatedAt)}
                  </p>
                </div>
                <StatusBadge status={e.status} />
              </Link>
            ))}
          </Card>
        </section>
      )}
    </div>
  );
}
