"use client";

import React, { useState, useEffect, Suspense, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useSWR from 'swr';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { Search, X, TrendingUp, Clock, Play, ChevronDown, Check, Radio } from 'lucide-react';
import { usePlayerStore, PlayerEpisode } from '../../store/playerStore';
import { AppDownloadModal } from '@/components/modals/AppDownloadModal';

const fetcher = (url: string) => fetchApi(url).then(res => res.data);

function CustomDropdown({ value, onChange, options, placeholder }: { value: string, onChange: (v: string) => void, options: {value: string, label: string}[], placeholder: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div className="relative z-20" ref={ref}>
      <div 
        onClick={() => setOpen(!open)} 
        className="bg-[#141414] border border-[#242424] rounded-xl p-2.5 flex items-center justify-between gap-2 cursor-pointer min-w-[200px] text-xs font-semibold text-white hover:border-[#FFBF00]/50 transition-colors shadow-sm"
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown className={`w-4 h-4 text-[#FFBF00] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>
      
      {open && (
        <div className="absolute top-full left-0 mt-2 w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden shadow-2xl max-h-[300px] overflow-y-auto flex flex-col p-1 animate-in fade-in zoom-in-95 duration-100">
          <div 
            onClick={() => { onChange(''); setOpen(false); }} 
            className={`p-2.5 text-xs cursor-pointer rounded-lg flex items-center justify-between transition-colors ${value === '' ? 'bg-[#FFBF00]/10 text-[#FFBF00] font-bold' : 'text-white hover:bg-[#242424]'}`}
          >
            <span>{placeholder}</span>
            {value === '' && <Check className="w-3.5 h-3.5" />}
          </div>
          {options.map(opt => (
            <div 
              key={opt.value} 
              onClick={() => { onChange(opt.value); setOpen(false); }} 
              className={`p-2.5 text-xs cursor-pointer rounded-lg flex items-center justify-between transition-colors ${value === opt.value ? 'bg-[#FFBF00]/10 text-[#FFBF00] font-bold' : 'text-[#D0D0D0] hover:bg-[#242424] hover:text-white'}`}
            >
              <span className="truncate">{opt.label}</span>
              {value === opt.value && <Check className="w-3.5 h-3.5" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ExploreContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { playEpisode } = usePlayerStore();

  const queryQ = searchParams.get('q') || '';
  const queryLang = searchParams.get('lang') || '';
  const queryCat = searchParams.get('category') || '';
  const queryTab = searchParams.get('tab') || 'all';

  const [searchInput, setSearchInput] = useState(queryQ);
  const [debouncedQ, setDebouncedQ] = useState(queryQ);

  const [activeTab, setActiveTab] = useState<'all' | 'podcasts' | 'episodes'>(queryTab as any);
  const [selectedLang, setSelectedLang] = useState(queryLang);
  const [selectedCat, setSelectedCat] = useState(queryCat);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem('bko_recent_searches');
      if (saved) setRecentSearches(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQ(searchInput), 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedQ) params.set('q', debouncedQ); else params.delete('q');
    if (selectedLang) params.set('lang', selectedLang); else params.delete('lang');
    if (selectedCat) params.set('category', selectedCat); else params.delete('category');
    if (activeTab !== 'all') params.set('tab', activeTab); else params.delete('tab');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    
    if (debouncedQ && debouncedQ.trim().length > 2) {
      if (!recentSearches.includes(debouncedQ.trim())) {
        const newRecent = [debouncedQ.trim(), ...recentSearches].slice(0, 5);
        setRecentSearches(newRecent);
        if (typeof window !== "undefined") {
          localStorage.setItem('bko_recent_searches', JSON.stringify(newRecent));
        }
      }
    }
  }, [debouncedQ, selectedLang, selectedCat, activeTab]);

  const { data: exploreData } = useSWR('/explore', fetcher);
  const { data: homeData } = useSWR(!debouncedQ ? '/home' : null, fetcher);
  
  const searchUrl = debouncedQ ? `/search?q=${encodeURIComponent(debouncedQ)}` : null;
  const { data: searchResults, isLoading: isSearchLoading } = useSWR(searchUrl, fetcher);

  const clearRecentSearches = () => {
    setRecentSearches([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem('bko_recent_searches');
    }
  };

  const removeRecentSearch = (item: string) => {
    const newRecent = recentSearches.filter(s => s !== item);
    setRecentSearches(newRecent);
    if (typeof window !== "undefined") {
      localStorage.setItem('bko_recent_searches', JSON.stringify(newRecent));
    }
  };

  const handlePlay = (ep: any) => {
    if (!ep) return;
    const playerEp: PlayerEpisode = {
      id: ep.id,
      slug: ep.slug || ep.id,
      title: ep.title,
      cover: ep.cover || ep.podcast?.cover || '/images/default-cover.jpg',
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

  let filteredPodcasts = searchResults?.podcasts || [];
  let filteredEpisodes = searchResults?.episodes || [];

  if (selectedLang) {
    filteredPodcasts = filteredPodcasts.filter((p: any) => p.primaryLanguage?.code === selectedLang);
    filteredEpisodes = filteredEpisodes.filter((e: any) => e.language?.code === selectedLang || e.podcast?.primaryLanguage?.code === selectedLang);
  }
  if (selectedCat) {
    filteredPodcasts = filteredPodcasts.filter((p: any) => p.categories?.some((c: any) => c.category?.slug === selectedCat));
  }

  const langOptions = (exploreData?.languages || []).map((l: any) => ({ value: l.code, label: l.name }));
  const activeCategories = (exploreData?.categories || []).filter((c: any) => c._count?.podcasts > 0);
  const catOptions = activeCategories.map((c: any) => ({ value: c.slug, label: c.name }));

  return (
    <div className="p-4 md:p-8 w-full space-y-8 animate-fade-in text-white select-none pb-32">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl md:text-3xl font-headline font-black text-white">Explorer</h1>
        <div className="flex items-center gap-2 bg-[#141414] border border-[#242424] rounded-xl p-2 max-w-2xl focus-within:border-[#FFBF00]/50 transition-colors shadow-sm">
          <Search className="w-5 h-5 text-[#666666] ml-2 shrink-0" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Rechercher une émission, un épisode..."
            className="w-full bg-transparent text-sm md:text-base text-white placeholder-[#666666] outline-none"
          />
          {searchInput && (
            <button onClick={() => setSearchInput('')} className="p-1.5 text-[#757575] hover:text-white mr-2">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <CustomDropdown 
          value={selectedLang} 
          onChange={setSelectedLang} 
          options={langOptions} 
          placeholder="Toutes les langues" 
        />
        <CustomDropdown 
          value={selectedCat} 
          onChange={setSelectedCat} 
          options={catOptions} 
          placeholder="Toutes les catégories" 
        />
      </div>

      {!debouncedQ && (
        <div className="space-y-12">
          {recentSearches.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#B8B8B8]">
                  <Clock className="w-3.5 h-3.5" /><span>Recherches récentes</span>
                </div>
                <button onClick={clearRecentSearches} className="text-[11px] text-[#757575] hover:text-white">Effacer tout</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map(item => (
                  <div key={item} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141414] border border-[#262626] text-xs text-[#B8B8B8]">
                    <span onClick={() => setSearchInput(item)} className="cursor-pointer hover:text-white">↗ {item}</span>
                    <button onClick={() => removeRecentSearch(item)} className="text-[#666666] hover:text-white">✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {homeData?.trending && homeData.trending.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FFBF00]">
                <TrendingUp className="w-4 h-4" /><span>Tendances du moment</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {homeData.trending.slice(0, 5).map((podcast: any) => (
                  <div key={podcast.id} className="group flex flex-col gap-2 p-2 rounded-xl hover:bg-[#141414] transition-colors border border-transparent hover:border-[#262626]">
                    <Link href={`/podcasts/${podcast.slug}`} className="relative aspect-square w-full rounded-lg overflow-hidden border border-[#262626]">
                      <Image unoptimized src={podcast.cover || '/images/default-cover.jpg'} alt={podcast.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                    </Link>
                    <div className="px-1">
                      <h3 className="text-xs font-bold text-white truncate">{podcast.name}</h3>
                      <p className="text-[10px] text-[#757575] truncate">{podcast.author?.fullName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeCategories.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
                <span>Parcourir par catégorie</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {activeCategories.map((cat: any) => (
                    <Link 
                      key={cat.slug} 
                      href={`/categories/${cat.slug}`}
                      className="group relative overflow-hidden rounded-2xl bg-[#141414] border border-[#222222] p-4 flex flex-col justify-between aspect-video hover:border-[#FFBF00] hover:bg-[#1c1c1c] transition-all duration-300"
                    >
                      <div className="flex justify-between items-start">
                        <div className="p-2 bg-[#222222] rounded-lg group-hover:bg-[#FFBF00]/10 transition-colors">
                          <Radio className="w-5 h-5 text-[#888888] group-hover:text-[#FFBF00] transition-colors" />
                        </div>
                        <span className="text-xs font-bold text-[#555555] group-hover:text-[#FFBF00]/70 transition-colors">
                          {cat._count?.podcasts || 0}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-white group-hover:text-[#FFBF00] transition-colors line-clamp-2 mt-2 leading-tight">
                        {cat.name}
                      </h3>
                    </Link>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}

      {debouncedQ && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-[#1C1C1C] pb-4">
            <button onClick={() => setActiveTab('all')} className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${activeTab === 'all' ? 'bg-[#FFBF00] text-[#0B0B0B]' : 'bg-[#141414] text-[#B8B8B8] hover:text-white border border-[#242424]'}`}>
              Tous les résultats ({filteredPodcasts.length + filteredEpisodes.length})
            </button>
            <button onClick={() => setActiveTab('podcasts')} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${activeTab === 'podcasts' ? 'bg-[#FFBF00] text-[#0B0B0B]' : 'bg-[#141414] text-[#B8B8B8] hover:text-white border border-[#242424]'}`}>
              Podcasts ({filteredPodcasts.length})
            </button>
            <button onClick={() => setActiveTab('episodes')} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${activeTab === 'episodes' ? 'bg-[#FFBF00] text-[#0B0B0B]' : 'bg-[#141414] text-[#B8B8B8] hover:text-white border border-[#242424]'}`}>
              Épisodes ({filteredEpisodes.length})
            </button>
          </div>

          {isSearchLoading ? (
             <div className="text-[#757575] text-sm">Recherche en cours...</div>
          ) : filteredPodcasts.length === 0 && filteredEpisodes.length === 0 ? (
            <div className="text-center py-12 text-[#757575]">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Aucun résultat pour "{debouncedQ}"</p>
              <button onClick={() => {setSearchInput(''); setSelectedCat(''); setSelectedLang('');}} className="text-xs text-[#FFBF00] mt-4 hover:underline">Réinitialiser la recherche et les filtres</button>
            </div>
          ) : (
            <div className="space-y-8">
              {(activeTab === 'all' || activeTab === 'podcasts') && filteredPodcasts.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white">Podcasts</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredPodcasts.map((podcast: any) => (
                      <div key={podcast.id} className="group flex flex-col gap-2 p-2 rounded-xl hover:bg-[#141414] transition-colors border border-transparent hover:border-[#262626]">
                        <Link href={`/podcasts/${podcast.slug}`} className="relative aspect-square w-full rounded-lg overflow-hidden border border-[#262626]">
                          <Image unoptimized src={podcast.cover || '/images/default-cover.jpg'} alt={podcast.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                        </Link>
                        <div className="px-1">
                          <h3 className="text-xs font-bold text-white truncate">{podcast.name}</h3>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(activeTab === 'all' || activeTab === 'episodes') && filteredEpisodes.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white">Épisodes</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {filteredEpisodes.map((ep: any) => (
                      <div key={ep.id} className="group flex items-center justify-between p-3 rounded-2xl hover:bg-[#141414] transition-all border border-transparent hover:border-[#222222]">
                        <div className="flex items-center gap-4">
                          <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-[#282828] cursor-pointer" onClick={() => handlePlay(ep)}>
                            <Image unoptimized src={ep.cover || '/images/default-cover.jpg'} alt={ep.title} fill className="object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="w-5 h-5 fill-white text-white" />
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <h4 className="text-sm font-bold text-white group-hover:text-[#FFBF00] transition-colors cursor-pointer" onClick={() => handlePlay(ep)}>
                              {ep.title}
                            </h4>
                            <span className="text-xs text-[#888888]">{ep.podcast?.name} • {Math.round((ep.durationSeconds || 0)/60)} min</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <AppDownloadModal isOpen={isAppModalOpen} onClose={() => setIsAppModalOpen(false)} />
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-[#757575]">Chargement de l'exploration...</div>}>
      <ExploreContent />
    </Suspense>
  );
}
