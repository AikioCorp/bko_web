"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from 'swr';
import {
  Bookmark, Clock, Play, Trash2, Radio, CheckCircle2,
  Smartphone, MoreVertical, Plus, ListMusic
} from 'lucide-react';
import { usePlayerStore, PlayerEpisode } from '../../store/playerStore';
import { useAuthStore } from '../../store/authStore';
import { fetchApi } from '@/lib/api';
import { AppDownloadModal } from '@/components/modals/AppDownloadModal';
import { CreatePlaylistModal } from '@/components/modals/CreatePlaylistModal';

const fetcher = (url: string) => fetchApi(url).then(res => res.data);

function LibraryContent() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const { playEpisode } = usePlayerStore();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as 'saved' | 'following' | 'history' | 'playlists';
  const [activeTab, setActiveTab] = useState<'saved' | 'following' | 'history' | 'playlists'>(tabParam || 'saved');
  useEffect(() => { if (tabParam) setActiveTab(tabParam); }, [tabParam]);
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);

  // Queries
  const { data: savedEpisodes, mutate: mutateSaved } = useSWR(isAuthenticated ? '/me/saved' : null, fetcher);
  const { data: followedPodcasts, mutate: mutateFollowed } = useSWR(isAuthenticated ? '/me/following' : null, fetcher);
  const { data: history, mutate: mutateHistory } = useSWR(isAuthenticated ? '/me/continue-listening' : null, fetcher);
  const { data: playlists, mutate: mutatePlaylists } = useSWR(isAuthenticated ? '/me/playlists' : null, fetcher);

  const handlePlay = (ep: any) => {
    if (!ep) return;
    const playerEp: PlayerEpisode = {
      id: ep.id,
      slug: ep.slug || ep.id,
      title: ep.title,
      cover: ep.cover || '/images/default-cover.jpg',
      durationSeconds: ep.durationSeconds || 1800,
      podcast: {
        slug: ep.podcast?.slug || 'podcast',
        name: ep.podcast?.name || 'Bamako Podcast',
        cover: ep.podcast?.cover || ep.cover,
      },
      mediaSources: ep.mediaSources && ep.mediaSources.length > 0 ? ep.mediaSources : [
        {
          id: `src-${ep.id}`,
          type: 'AUDIO',
          sourceType: 'UPLOAD',
          playbackMode: 'NATIVE',
          externalUrl: '',
          durationSeconds: ep.durationSeconds || 1800,
          isPrimaryAudio: true,
        },
      ],
    };
    playEpisode(playerEp);
  };

  const unsaveEpisode = async (id: string) => {
    await fetchApi(`/episodes/${id}/save`, { method: 'DELETE' });
    mutateSaved();
  };

  const unfollowPodcast = async (id: string) => {
    await fetchApi(`/podcasts/${id}/follow`, { method: 'DELETE' });
    mutateFollowed();
  };

  
  const createPlaylist = async () => {
    const name = prompt('Nom de la nouvelle playlist :');
    if (!name || name.trim() === '') return;
    try {
      await fetchApi('/playlists', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), isPublic: false })
      });
      mutatePlaylists();
    } catch (e) {
      alert('Erreur lors de la création de la playlist');
    }
  };

  const clearHistory = async () => {
    if (confirm('Voulez-vous vraiment effacer votre historique ?')) {
      await fetchApi('/me/history', { method: 'DELETE' });
      mutateHistory();
    }
  };

  if (isAuthLoading) {
    return <div className="p-8 text-white">Chargement de votre bibliothèque...</div>;
  }

  if (!isAuthenticated) {
    if (typeof window !== "undefined") {
      router.replace("/login?redirect=/library");
    }
    return <div className="p-8 text-[#757575]">Redirection vers la connexion...</div>;
  }

  return (
    <div className="p-4 md:p-8 w-full space-y-8 animate-fade-in text-white select-none pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-headline font-black text-white">
            Ma Bibliothèque
          </h1>
          <p className="text-xs text-[#B8B8B8] mt-1">
            Retrouvez vos épisodes enregistrés, vos émissions suivies et votre historique.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-[#141414] border border-[#242424] rounded-xl p-1 text-xs overflow-x-auto">
          <button onClick={() => setActiveTab('saved')} className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${activeTab === 'saved' ? 'bg-[#FFBF00] text-[#0B0B0B]' : 'text-[#888888] hover:text-white'}`}>
            Enregistrés
          </button>
          <button onClick={() => setActiveTab('following')} className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${activeTab === 'following' ? 'bg-[#FFBF00] text-[#0B0B0B]' : 'text-[#888888] hover:text-white'}`}>
            Émissions suivies
          </button>
          <button onClick={() => setActiveTab('history')} className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${activeTab === 'history' ? 'bg-[#FFBF00] text-[#0B0B0B]' : 'text-[#888888] hover:text-white'}`}>
            Historique
          </button>
          <button onClick={() => setActiveTab('playlists')} className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${activeTab === 'playlists' ? 'bg-[#FFBF00] text-[#0B0B0B]' : 'text-[#888888] hover:text-white'}`}>
            Playlists
          </button>
        </div>
      </div>

      {/* Tab: Saved */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          {!savedEpisodes ? (
            <div className="text-[#757575] text-sm">Chargement des enregistrements...</div>
          ) : savedEpisodes.length === 0 ? (
            <div className="text-center py-12 text-[#757575]">
              <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Aucun épisode enregistré pour le moment.</p>
            </div>
          ) : (
            savedEpisodes.map((se: any) => (
              <div key={se.id} className="group flex items-center justify-between p-3 rounded-2xl hover:bg-[#141414] transition-all border border-transparent hover:border-[#222222]">
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-[#282828] cursor-pointer" onClick={() => handlePlay(se)}>
                    <Image unoptimized src={se?.cover || se?.podcast?.cover || '/images/default-cover.jpg'} alt={se?.title || ''} fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-5 h-5 fill-white text-white" />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <h4 className="text-sm font-bold text-white group-hover:text-[#FFBF00] transition-colors cursor-pointer" onClick={() => handlePlay(se)}>
                      {se?.title}
                    </h4>
                    <span className="text-xs text-[#888888]">{se?.podcast?.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => unsaveEpisode(se.id)} className="text-xs text-[#FFBF00] hover:text-white transition-colors">Retirer</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Following */}
      {activeTab === 'following' && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {!followedPodcasts ? (
            <div className="text-[#757575] text-sm col-span-full">Chargement des abonnements...</div>
          ) : followedPodcasts.length === 0 ? (
            <div className="text-center py-12 text-[#757575] col-span-full">
              <Radio className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Vous ne suivez aucune émission.</p>
            </div>
          ) : (
            followedPodcasts.map((podcast: any) => (
              <div key={podcast.id} className="group flex flex-col gap-2 p-2 rounded-xl hover:bg-[#141414] transition-colors border border-transparent hover:border-[#262626]">
                <Link href={`/podcasts/${podcast.slug}`} className="relative aspect-square w-full rounded-lg overflow-hidden border border-[#262626]">
                  <Image unoptimized src={podcast.cover || '/images/default-cover.jpg'} alt={podcast.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                </Link>
                <div className="px-1">
                  <h3 className="text-xs font-bold text-white truncate">{podcast.name}</h3>
                  <button onClick={() => unfollowPodcast(podcast.id)} className="text-[10px] text-[#757575] hover:text-red-400 mt-1 transition-colors">Ne plus suivre</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: History */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-white">Récemment écoutés</h2>
            {history && history.length > 0 && (
              <button onClick={clearHistory} className="text-xs text-[#757575] hover:text-white">Effacer l'historique</button>
            )}
          </div>
          {!history ? (
            <div className="text-[#757575] text-sm">Chargement de l'historique...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-[#757575]">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Votre historique est vide.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map((h: any) => {
                const ep = h.episode;
                const progress = ep?.durationSeconds ? (h.positionSeconds / ep.durationSeconds) * 100 : 0;
                return (
                  <div key={h.id} className="group flex flex-col bg-[#141414] border border-[#262626] rounded-2xl p-3 hover:border-[#FFBF00]/40 transition-colors cursor-pointer" onClick={() => handlePlay(ep)}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-[#282828] shrink-0">
                        <Image unoptimized src={ep?.cover || ep?.podcast?.cover || '/images/default-cover.jpg'} alt={ep?.title || ''} fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-4 h-4 fill-white text-white" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-[#FFBF00] uppercase truncate block">{ep?.podcast?.name}</span>
                        <h4 className="text-xs font-bold text-white truncate">{ep?.title}</h4>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-[#262626] rounded-full overflow-hidden">
                      <div className="h-full bg-[#FFBF00]" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Playlists */}
      {activeTab === 'playlists' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-white">Vos Playlists</h2>
            <button onClick={createPlaylist} className="flex items-center gap-1.5 text-xs text-[#0B0B0B] bg-[#FFBF00] px-3 py-1.5 rounded-full font-bold hover:bg-[#E5AB00]">
              <Plus className="w-3.5 h-3.5" /> Créer
            </button>
          </div>
          {!playlists ? (
            <div className="text-[#757575] text-sm">Chargement des playlists...</div>
          ) : playlists.length === 0 ? (
            <div className="text-center py-12 text-[#757575]">
              <ListMusic className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Vous n'avez pas encore créé de playlist.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {playlists.map((pl: any) => (
                <div key={pl.id} className="group p-3 bg-[#141414] border border-[#262626] rounded-xl hover:border-[#FFBF00]/40 transition-colors">
                  <div className="aspect-square bg-[#222222] rounded-lg flex items-center justify-center mb-3">
                    <ListMusic className="w-8 h-8 text-[#444444]" />
                  </div>
                  <h4 className="text-sm font-bold text-white truncate">{pl.name}</h4>
                  <p className="text-xs text-[#757575]">{pl._count?.items || 0} épisodes</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <AppDownloadModal isOpen={isAppModalOpen} onClose={() => setIsAppModalOpen(false)} />
    </div>
  );
}


export default function LibraryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-white">Chargement...</div>}>
      <LibraryContent />
    </Suspense>
  );
}
