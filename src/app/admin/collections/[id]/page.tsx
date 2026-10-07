"use client";
import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { adminApi } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Save, Plus, GripVertical, Trash2, Search, Loader2 } from "lucide-react";
import Link from "next/link";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function CollectionEditPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  
  const fetcher = (url: string) => adminApi(url).then(res => res.data);
  const { data: collection, mutate, error, isLoading } = useSWR(`/admin/collections/${id}`, fetcher);
  
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (collection) {
      setFormData({
        title: collection.title || "",
        description: collection.description || "",
        cover: collection.cover || "",
        isFeatured: collection.isFeatured || false,
      });
    }
  }, [collection]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await adminApi(`/admin/collections/${collection.id}`, { method: "PATCH", body: JSON.stringify(formData) });
      await mutate(collection, false);
      mutate();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const searchItems = async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      setIsSearching(true);
      const res = await adminApi(`/admin/catalog?search=${encodeURIComponent(q)}&limit=10`);
      // We allow adding podcasts or episodes to collections
      const results = [...(res.data.podcasts || []), ...(res.data.episodes || [])];
      setSearchResults(results.slice(0, 10));
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      searchItems(searchQuery);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleAddItem = async (item: any) => {
    try {
      const payload: any = {};
      // Determine if it's a podcast or episode based on some property (e.g., episode has podcastId usually, but let's check by type or assumption)
      if (item.episodeType || item.youtubeId || item.audioUrl || (item.podcast && item.podcast.id)) {
        payload.episodeId = item.id;
      } else {
        payload.podcastId = item.id;
      }

      await adminApi(`/admin/collections/${collection.id}/items`, { method: "POST", body: JSON.stringify(payload) });
      await mutate();
      setIsSearchOpen(false);
      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'ajout");
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      mutate({ ...collection, items: collection.items.filter((i: any) => i.id !== itemId) }, false);
      await adminApi(`/admin/collections/items/${itemId}`, { method: "DELETE" });
      mutate();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <div className="p-8 text-[#888888]">Chargement...</div>;
  if (error || !collection) return <div className="p-8 text-red-500">Introuvable</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto pb-32">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/collections" className="p-2 hover:bg-[#1A1A1A] rounded-full transition-colors text-[#888888] hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white leading-tight">Éditer la collection</h1>
            <p className="text-sm text-[#888888]">{collection.slug}</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-white text-black px-4 py-2 rounded-full font-semibold text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Enregistrer
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form */}
        <div className="space-y-6">
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-6 space-y-6">
            <h2 className="font-semibold text-white">Paramètres</h2>
            
            <div>
              <label className="block text-sm font-medium text-[#888888] mb-1">Titre</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl px-4 py-2 text-white outline-none focus:border-[#444444]"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#888888] mb-1">Description (optionnelle)</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl px-4 py-2 text-white outline-none focus:border-[#444444] resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#888888] mb-1">URL de la pochette</label>
              <input
                type="text"
                value={formData.cover}
                onChange={e => setFormData({ ...formData, cover: e.target.value })}
                placeholder="https://..."
                className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl px-4 py-2 text-white outline-none focus:border-[#444444]"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#2A2A2A]">
              <div>
                <div className="font-medium text-white">Mise en avant</div>
                <div className="text-xs text-[#888888]">Mettre en avant cette collection</div>
              </div>
              <button
                onClick={() => setFormData({ ...formData, isFeatured: !formData.isFeatured })}
                className={classNames(
                  "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  formData.isFeatured ? "bg-[#FFBF00]" : "bg-[#2A2A2A]"
                )}
              >
                <span
                  className={classNames(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out",
                    formData.isFeatured ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Items */}
        <div className="lg:col-span-2">
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-semibold text-white">Contenu de la collection</h2>
                <p className="text-xs text-[#888888]">{collection.items?.length || 0} élément(s)</p>
              </div>
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="bg-[#2A2A2A] hover:bg-[#333333] text-white px-3 py-1.5 rounded-xl font-medium text-sm transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>

            {isSearchOpen && (
              <div className="mb-6 p-4 border border-[#2A2A2A] rounded-xl bg-[#0B0B0B]">
                <div className="relative mb-4">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un podcast ou épisode..."
                    className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg pl-9 pr-4 py-2 text-sm text-white outline-none focus:border-[#444444]"
                  />
                </div>
                
                {isSearching ? (
                  <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-[#888888]" /></div>
                ) : searchResults.length > 0 ? (
                  <ul className="space-y-2">
                    {searchResults.map((res: any) => (
                      <li key={res.id} className="flex items-center justify-between p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors group">
                        <div className="flex items-center gap-3">
                          {res.cover && (
                            <img src={res.cover} alt="" className="w-10 h-10 rounded-md object-cover" />
                          )}
                          <div>
                            <span className="text-sm font-medium text-white block">{(res.title || res.name)}</span>
                            <span className="text-xs text-[#888888]">{res.podcast ? "Épisode" : "Podcast"}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddItem(res)}
                          className="text-xs font-semibold bg-white text-black px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Ajouter
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : searchQuery ? (
                  <div className="text-center py-4 text-sm text-[#888888]">Aucun résultat.</div>
                ) : null}
              </div>
            )}

            <div className="space-y-2">
              {collection.items?.length === 0 ? (
                <div className="text-center py-10 border border-[#2A2A2A] border-dashed rounded-xl text-[#888888] text-sm">
                  Cette collection est vide.
                </div>
              ) : (
                collection.items?.map((item: any, index: number) => {
                  const target = item.podcast || item.episode;
                  return (
                    <div key={item.id} className="flex items-center justify-between bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl p-3 group hover:border-[#444444] transition-colors">
                      <div className="flex items-center gap-4">
                        <GripVertical className="w-5 h-5 text-[#333333] cursor-grab hover:text-white" />
                        <div className="text-[#888888] text-xs font-mono">{index + 1}</div>
                        {target?.cover ? (
                          <img src={target.cover} alt="" className="w-10 h-10 rounded-md object-cover border border-[#2A2A2A]" />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-[#1C1C1C] border border-[#2A2A2A]" />
                        )}
                        <div>
                          <div className="font-medium text-sm text-white">{(target?.title || target?.name) || "Inconnu"}</div>
                          <div className="text-xs text-[#888888]">{item.podcast ? "Podcast" : "Épisode"}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-2 text-[#888888] hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                        title="Retirer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
