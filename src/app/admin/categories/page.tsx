"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { adminApi } from "@/lib/api";
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit2,
  Power,
  PowerOff,
  CheckCircle,
  XCircle,
  Tag,
  Globe,
  Loader2,
  Trash2,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CategoriesLanguagesPage() {
  const [activeTab, setActiveTab] = useState<"Categories" | "Languages">("Categories");
  const [search, setSearch] = useState("");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingItem, setDeletingItem] = useState<any>(null); // For modal

  // Categories Fetch
  const { data: catData, mutate: mutateCat, isLoading: catLoading } = useSWR(
    "/admin/categories",
    (url) => adminApi(url).then(res => res.data)
  );

  // Languages Fetch
  const { data: langData, mutate: mutateLang, isLoading: langLoading } = useSWR(
    "/admin/languages",
    (url) => adminApi(url).then(res => res.data)
  );

  // Search Filter
  const categories = (catData || []).filter((c: any) => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );
  const languages = (langData || []).filter((l: any) => 
    l.name.toLowerCase().includes(search.toLowerCase()) || 
    l.code.toLowerCase().includes(search.toLowerCase()) ||
    l.nativeName.toLowerCase().includes(search.toLowerCase())
  );

  // Add/Edit Actions
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const payload = {
      name: formData.get("name"),
      slug: formData.get("slug"),
      description: formData.get("description"),
      icon: formData.get("icon"),
    };

    try {
      if (editingItem?.id) {
        await adminApi(`/admin/categories/${editingItem.id}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await adminApi("/admin/categories", { method: "POST", body: JSON.stringify(payload) });
      }
      mutateCat();
      setEditingItem(null);
    } catch (e: any) {
      alert("Erreur: " + e.message);
    }
  };

  const confirmDeleteCategory = async (id: string) => {
    try {
      const res = await adminApi(`/admin/categories/${id}`, { method: "DELETE" });
      if (!res.success) throw new Error(res.message || "Erreur de suppression");
      mutateCat();
      setDeletingItem(null);
    } catch (e: any) {
      alert("Erreur: " + e.message);
    }
  };

  const confirmDeleteLanguage = async (code: string) => {
    try {
      const res = await adminApi(`/admin/languages/${code}`, { method: "DELETE" });
      if (!res.success) throw new Error(res.message || "Erreur de suppression");
      mutateLang();
      setDeletingItem(null);
    } catch (e: any) {
      alert("Erreur: " + e.message);
    }
  };

  const handleToggleCategory = async (cat: any) => {
    try {
      await adminApi(`/admin/categories/${cat.id}`, { 
        method: "PUT", 
        body: JSON.stringify({ ...cat, isActive: !cat.isActive }) 
      });
      mutateCat();
    } catch (e: any) {
      alert("Erreur: " + e.message);
    }
  };

  const handleSaveLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const payload = {
      code: formData.get("code"),
      name: formData.get("name"),
      nativeName: formData.get("nativeName"),
    };

    try {
      if (editingItem?.isEdit) {
        await adminApi(`/admin/languages/${editingItem.code}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await adminApi("/admin/languages", { method: "POST", body: JSON.stringify(payload) });
      }
      mutateLang();
      setEditingItem(null);
    } catch (e: any) {
      alert("Erreur: " + e.message);
    }
  };

  const handleToggleLanguage = async (lang: any) => {
    try {
      await adminApi(`/admin/languages/${lang.code}`, { 
        method: "PUT", 
        body: JSON.stringify({ ...lang, isActive: !lang.isActive }) 
      });
      mutateLang();
    } catch (e: any) {
      alert("Erreur: " + e.message);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-6 pb-24 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <Tag className="w-8 h-8 text-[#FFBF00]" />
            CatÃ©gories et langues
          </h1>
          <p className="text-[#888888] mt-2">GÃ©rez les choix disponibles pour la classification des podcasts.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#2A2A2A] overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("Categories")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "Categories" 
              ? "border-[#FFBF00] text-white" 
              : "border-transparent text-[#757575] hover:text-white"
          }`}
        >
          <Tag className="w-4 h-4" /> CatÃ©gories
        </button>
        <button
          onClick={() => setActiveTab("Languages")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "Languages" 
              ? "border-[#FFBF00] text-white" 
              : "border-transparent text-[#757575] hover:text-white"
          }`}
        >
          <Globe className="w-4 h-4" /> Langues
        </button>
      </div>

      {/* Tab Header (Search & Actions) */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#757575]" />
          <input 
            type="text" 
            placeholder={`Rechercher une ${activeTab === "Categories" ? "catÃ©gorie" : "langue"}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#171717] border border-[#2A2A2A] rounded-lg pl-10 pr-4 py-2 text-sm focus:border-[#FFBF00] outline-none text-white placeholder-[#757575]"
          />
        </div>
        <Button 
          onClick={() => setEditingItem(activeTab === "Categories" ? { isCategory: true } : { isLanguage: true })}
          className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold w-full md:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" /> 
          Ajouter une {activeTab === "Categories" ? "catÃ©gorie" : "langue"}
        </Button>
      </div>

      {/* Table Container */}
      <div className="bg-[#171717] border border-[#2A2A2A] rounded-xl overflow-hidden">
        {activeTab === "Categories" && (
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#2A2A2A] text-xs font-semibold text-[#757575] uppercase tracking-wider bg-[#0B0B0B]/50">
                  <th className="p-4">Nom</th>
                  <th className="p-4">Description</th>
                  <th className="p-4 text-center">Podcasts associÃ©s</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {catLoading ? (
                  <tr><td colSpan={5} className="p-12 text-center text-[#757575]"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
                ) : categories.length === 0 ? (
                  <tr><td colSpan={5} className="p-12 text-center text-[#757575]">Aucune catÃ©gorie trouvÃ©e.</td></tr>
                ) : (
                  categories.map((cat: any) => (
                    <tr key={cat.id} className="hover:bg-[#1C1C1C] transition-colors group cursor-pointer" onClick={() => setEditingItem({ ...cat, isCategory: true })}>
                      <td className="p-4 font-bold text-white text-sm">{cat.icon} {cat.name}</td>
                      <td className="p-4 text-sm text-[#B8B8B8] max-w-md truncate">{cat.description || "â€”"}</td>
                      <td className="p-4 text-center text-sm font-bold text-[#FFBF00]">{cat._count?.podcasts || 0}</td>
                      <td className="p-4">
                        {cat.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-green-500/10 text-green-500">
                            <CheckCircle className="w-3.5 h-3.5" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#2A2A2A] text-[#757575]">
                            <XCircle className="w-3.5 h-3.5" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          
                          <Button size="sm" variant="ghost" className="h-8 px-2 text-[#B8B8B8] hover:text-white" onClick={(e) => { e.stopPropagation(); handleToggleCategory(cat); }}>
                              {cat.isActive ? <Power className="w-4 h-4 text-[#B8B8B8]" /> : <Play className="w-4 h-4 text-[#757575]" />}
                            </Button>
                            {cat._count?.podcasts === 0 && (
                              <Button size="sm" variant="ghost" className="h-8 px-2 text-red-500 hover:text-red-400" onClick={(e) => { e.stopPropagation(); setDeletingItem({ id: cat.id, isCategory: true, name: cat.name }); }}>
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "Languages" && (
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#2A2A2A] text-xs font-semibold text-[#757575] uppercase tracking-wider bg-[#0B0B0B]/50">
                  <th className="p-4">Code</th>
                  <th className="p-4">Nom affichÃ©</th>
                  <th className="p-4">Nom dans la langue</th>
                  <th className="p-4 text-center">Podcasts associÃ©s</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {langLoading ? (
                  <tr><td colSpan={6} className="p-12 text-center text-[#757575]"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
                ) : languages.length === 0 ? (
                  <tr><td colSpan={6} className="p-12 text-center text-[#757575]">Aucune langue trouvÃ©e.</td></tr>
                ) : (
                  languages.map((lang: any) => (
                    <tr key={lang.code} className="hover:bg-[#1C1C1C] transition-colors group cursor-pointer" onClick={() => setEditingItem({ ...lang, isLanguage: true, isEdit: true })}>
                      <td className="p-4 font-mono text-sm text-[#757575]">{lang.code}</td>
                      <td className="p-4 font-bold text-white text-sm">{lang.name}</td>
                      <td className="p-4 text-sm text-[#B8B8B8]">{lang.nativeName}</td>
                      <td className="p-4 text-center text-sm font-bold text-[#FFBF00]">{lang._count?.primaryPodcasts || 0}</td>
                      <td className="p-4">
                        {lang.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-green-500/10 text-green-500">
                            <CheckCircle className="w-3.5 h-3.5" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#2A2A2A] text-[#757575]">
                            <XCircle className="w-3.5 h-3.5" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          
                          <Button size="sm" variant="ghost" className="h-8 px-2 text-[#B8B8B8] hover:text-white" onClick={(e) => { e.stopPropagation(); handleToggleLanguage(lang); }}>
                              {lang.isActive ? <Power className="w-4 h-4 text-[#B8B8B8]" /> : <Play className="w-4 h-4 text-[#757575]" />}
                            </Button>
                            {(lang._count?.primaryPodcasts || 0) + (lang._count?.secondaryPodcasts || 0) === 0 && (
                              <Button size="sm" variant="ghost" className="h-8 px-2 text-red-500 hover:text-red-400" onClick={(e) => { e.stopPropagation(); setDeletingItem({ code: lang.code, isLanguage: true, name: lang.name }); }}>
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      
      {/* Deletion Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4" onClick={() => setDeletingItem(null)}>
          <div className="bg-[#171717] border border-[#2A2A2A] rounded-xl w-full max-w-sm shadow-2xl p-6 animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-2">Confirmer la suppression</h2>
            <p className="text-[#888888] text-sm mb-6">
              Voulez-vous vraiment supprimer {deletingItem.isCategory ? "la catÃ©gorie" : "la langue"} <strong className="text-white">{deletingItem.name}</strong> ? Cette action est irrÃ©versible.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" className="text-[#B8B8B8] hover:text-white" onClick={() => setDeletingItem(null)}>Annuler</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => {
                  if (deletingItem.isCategory) confirmDeleteCategory(deletingItem.id);
                  else confirmDeleteLanguage(deletingItem.code);
              }}>Supprimer</Button>
            </div>
          </div>
        </div>
      )}

      {/* Editor Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setEditingItem(null)}>
          <div className="bg-[#171717] border border-[#2A2A2A] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[#2A2A2A]">
              <h2 className="text-xl font-bold text-white">
                {editingItem.id || editingItem.isEdit ? "Modifier" : "Ajouter"}{" "}
                {editingItem.isCategory ? "une catÃ©gorie" : "une langue"}
              </h2>
            </div>
            
            <form onSubmit={editingItem.isCategory ? handleSaveCategory : handleSaveLanguage} className="p-6 space-y-4">
              
              {editingItem.isCategory ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#757575] uppercase mb-2">Nom de la catÃ©gorie</label>
                    <input name="name" required defaultValue={editingItem.name} className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#757575] uppercase mb-2">Identifiant (slug)</label>
                    <input name="slug" required defaultValue={editingItem.slug} className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white font-mono" />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-[#757575] uppercase mb-2">Description</label>
                    <textarea name="description" rows={3} defaultValue={editingItem.description} className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white resize-none" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#757575] uppercase mb-2">Code de la langue (ex: fr, bm)</label>
                    <input name="code" required disabled={editingItem.isEdit} defaultValue={editingItem.code} className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white font-mono disabled:opacity-50" />
                    {editingItem.isEdit && <p className="text-xs text-[#757575] mt-1">Le code sert de rÃ©fÃ©rence stable et ne peut Ãªtre modifiÃ©.</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#757575] uppercase mb-2">Nom affichÃ©</label>
                    <input name="name" required defaultValue={editingItem.name} className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#757575] uppercase mb-2">Nom dans la langue (nativeName)</label>
                    <input name="nativeName" required defaultValue={editingItem.nativeName} className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white" />
                  </div>
                </>
              )}

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#2A2A2A]">
                <Button type="button" variant="ghost" className="text-[#B8B8B8] hover:text-white" onClick={() => setEditingItem(null)}>Annuler</Button>
                <Button type="submit" className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold">Enregistrer</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

