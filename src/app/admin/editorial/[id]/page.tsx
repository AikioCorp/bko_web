"use client";
import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { adminApi } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Save, Plus, GripVertical, Trash2, Search, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function EditorialEditPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  
  const fetcher = (url: string) => adminApi(url).then(res => res.data);
  const { data: section, mutate, error, isLoading } = useSWR(`/admin/editorial/sections/${id}`, fetcher);
  
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (section) {
      setFormData({
        title: section.title || "",
        subtitle: section.subtitle || "",
        type: section.type || "HERO",
        isActive: section.isActive || false,
      });
    }
  }, [section]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await adminApi(`/admin/editorial/sections/${section.id}`, { method: "PATCH", body: JSON.stringify(formData) });
      await mutate(section, false);
      // simulate optimistic UX, the real mutate with true can happen in background
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
      // Assuming a generic search endpoint exists, or we search catalog
      const res = await adminApi(`/admin/catalog?search=${encodeURIComponent(q)}&limit=10`);
      setSearchResults(res.data.podcasts || []);
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

  const handleAddItem = async (podcast: any) => {
    try {
      await adminApi(`/admin/editorial/sections/${section.id}/items`, {
        method: "POST",
        body: JSON.stringify({ podcastId: podcast.id })
      });
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
      // Optimistic update
      mutate({ ...section, items: section.items.filter((i: any) => i.id !== itemId) }, false);
      await adminApi(`/admin/editorial/sections/items/${itemId}`, { method: "DELETE" });
      mutate();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <div className="p-8 text-[#888888]">Chargement...</div>;
  if (error || !section) return <div className="p-8 text-red-500">Introuvable</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/editorial" className="p-2 hover:bg-[#1A1A1A] rounded-full transition-colors text-[#888888] hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white leading-tight">Ã‰diter la section</h1>
            <p className="text-sm text-[#888888]">{section.slug}</p>
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
            <h2 className="font-semibold text-white">ParamÃ¨tres</h2>
            
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
              <label className="block text-sm font-medium text-[#888888] mb-1">Sous-titre (optionnel)</label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl px-4 py-2 text-white outline-none focus:border-[#444444]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#888888] mb-1">Type d'affichage</label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl px-4 py-2 text-white outline-none focus:border-[#444444]"
              >
                <option value="HERO">Hero (BanniÃ¨re d'en-tÃªte)</option>
                <option value="PODCAST_ROW">Ligne de Podcasts</option>
                <option value="EPISODE_ROW">Ligne d'Ã‰pisodes</option>
                <option value="PERSON_ROW">Ligne de PersonnalitÃ©s</option>
                <option value="COLLECTION_ROW">Ligne de Collections</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#2A2A2A]">
              <div>
                <div className="font-medium text-white">Statut d'affichage</div>
                <div className="text-xs text-[#888888]">Rendre cette section visible sur l'accueil</div>
              </div>
              <button
                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                className={classNames(
                  "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  formData.isActive ? "bg-white" : "bg-[#2A2A2A]"
                )}
              >
                <span
                  className={classNames(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out",
                    formData.isActive ? "translate-x-5" : "translate-x-0"
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
                <h2 className="font-semibold text-white">Ã‰lÃ©ments de la section</h2>
                <p className="text-xs text-[#888888]">{section.items?.length || 0} Ã©lÃ©ment(s)</p>
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
                    placeholder="Rechercher un podcast Ã  ajouter..."
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
                          <span className="text-sm font-medium text-white">{(res.title || res.name)}</span>
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
                  <div className="text-center py-4 text-sm text-[#888888]">Aucun rÃ©sultat.</div>
                ) : null}
              </div>
            )}

            <div className="space-y-2">
              {section.items?.length === 0 ? (
                <div className="text-center py-10 border border-[#2A2A2A] border-dashed rounded-xl text-[#888888] text-sm">
                  Cette section est vide.
                </div>
              ) : (
                section.items?.map((item: any, index: number) => {
                  const target = item.podcast || item.episode || item.collection;
                  return (
                    <div key={item.id} className="flex items-center justify-between bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl p-3 group hover:border-[#444444] transition-colors">
                      <div className="flex items-center gap-4">
                        <GripVertical className="w-5 h-5 text-[#333333] cursor-grab hover:text-white" />
                        <div className="text-[#888888] text-xs font-mono">{index + 1}</div>
                        {target?.cover || target?.cover ? (
                          <img src={target.cover || target.cover} alt="" className="w-10 h-10 rounded-md object-cover border border-[#2A2A2A]" />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-[#1C1C1C] border border-[#2A2A2A]" />
                        )}
                        <div>
                          <div className="font-medium text-sm text-white">{(target?.title || target?.name) || "Inconnu"}</div>
                          <div className="text-xs text-[#888888]">{item.podcast ? "Podcast" : item.episode ? "Ã‰pisode" : "Collection"}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-2 text-[#888888] hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                        title="Retirer de la section"
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
