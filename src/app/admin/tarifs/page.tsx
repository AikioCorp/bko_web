"use client";
import React, { useState } from "react";
import useSWR from "swr";
import { adminApi } from "@/lib/api";
import { Plus, Edit2, Trash2, GripVertical, CheckCircle, XCircle, Star, Package, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function StudioOffersPage() {
  const fetcher = (url: string) => adminApi(url).then(res => res.data);
  const { data: offers, mutate, isLoading } = useSWR("/admin/studio-offers", fetcher);

  const [isEditing, setIsEditing] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [featureInput, setFeatureInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenEdit = (offer?: any) => {
    if (offer) {
      setIsEditing(offer);
      setFormData({
        ...offer,
        features: offer.features || []
      });
    } else {
      setIsEditing({ isNew: true });
      setFormData({
        type: "PACKAGE",
        name: "",
        price: "",
        unit: "",
        description: "",
        features: [],
        isPopular: false,
        isActive: true,
        order: (offers?.length || 0) + 1
      });
    }
  };

  const handleAddFeature = () => {
    if (!featureInput.trim()) return;
    setFormData({ ...formData, features: [...formData.features, featureInput.trim()] });
    setFeatureInput("");
  };

  const handleRemoveFeature = (idx: number) => {
    setFormData({ ...formData, features: formData.features.filter((_: any, i: number) => i !== idx) });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      if (isEditing.isNew) {
        await adminApi("/admin/studio-offers", { method: "POST", body: JSON.stringify(formData) });
      } else {
        await adminApi(`/admin/studio-offers/${isEditing.id}`, { method: "PATCH", body: JSON.stringify(formData) });
      }
      await mutate();
      setIsEditing(null);
    } catch (err: any) {
      alert("Erreur: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette offre ?")) return;
    try {
      await adminApi(`/admin/studio-offers/${id}`, { method: "DELETE" });
      await mutate();
    } catch (err: any) {
      alert("Erreur: " + err.message);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto pb-32">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Tarification Studio</h1>
          <p className="text-[#888888]">Gérez les forfaits (Packages) et services additionnels du Studio Bamako.</p>
        </div>
        <Button onClick={() => handleOpenEdit()} className="bg-[#FFBF00] text-black font-bold hover:bg-[#E5AB00]">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Offre
        </Button>
      </div>

      {isLoading && !offers ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 text-[#FFBF00] animate-spin" />
        </div>
      ) : offers?.length === 0 ? (
        <div className="text-center py-16 border border-[#222] border-dashed rounded-2xl bg-[#111]">
          <Package className="w-12 h-12 text-[#333] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Aucune offre</h3>
          <p className="text-[#888888]">Créez le premier forfait pour vos futurs créateurs.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers?.map((offer: any) => (
            <div key={offer.id} className={classNames(
              "relative bg-[#111] border rounded-2xl p-6 transition-all",
              offer.isPopular ? "border-[#FFBF00]" : "border-[#222]",
              !offer.isActive && "opacity-60 grayscale"
            )}>
              {offer.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FFBF00] text-black text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3 fill-black" />
                  Populaire
                </div>
              )}
              
              <div className="flex justify-between items-start mb-4">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#222] text-[#888]">
                  {offer.type === "PACKAGE" ? "Forfait" : "Service à la carte"}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenEdit(offer)} className="p-1.5 text-[#888] hover:text-white bg-[#222] rounded-lg transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(offer.id)} className="p-1.5 text-red-500 hover:text-red-400 bg-red-950/20 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-2">{offer.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-2xl font-bold text-white">{offer.price}</span>
                {offer.unit && <span className="text-sm text-[#888]">/{offer.unit}</span>}
              </div>
              <p className="text-sm text-[#888] mb-6 h-10 line-clamp-2">{offer.description}</p>
              
              <ul className="space-y-3">
                {offer.features?.map((feat: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#ccc]">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <span className="leading-tight">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Slide-over Modal for Editing */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setIsEditing(null)} />
          <div className="relative bg-[#111] border border-[#222] w-full max-w-lg rounded-2xl shadow-2xl p-6 flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <h2 className="text-xl font-bold text-white mb-6 border-b border-[#222] pb-4">
              {isEditing.isNew ? "Créer une offre" : "Modifier l'offre"}
            </h2>
            
            <form onSubmit={handleSave} className="overflow-y-auto pr-2 space-y-4 pb-4 custom-scrollbar flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#888] uppercase mb-1">Type d'offre</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg p-2.5 text-sm text-white outline-none focus:border-[#FFBF00]"
                  >
                    <option value="PACKAGE">Forfait complet (Package)</option>
                    <option value="SERVICE">Service additionnel (À la carte)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#888] uppercase mb-1">Nom</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg p-2.5 text-sm text-white outline-none focus:border-[#FFBF00]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#888] uppercase mb-1">Prix (texte, ex: 15.000 FCFA)</label>
                  <input
                    required
                    type="text"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg p-2.5 text-sm text-white outline-none focus:border-[#FFBF00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#888] uppercase mb-1">Unité (ex: heure, mois)</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg p-2.5 text-sm text-white outline-none focus:border-[#FFBF00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#888] uppercase mb-1">Description courte</label>
                <textarea
                  required
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg p-2.5 text-sm text-white outline-none focus:border-[#FFBF00] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#888] uppercase mb-2">Avantages inclus (Features)</label>
                <ul className="space-y-2 mb-3">
                  {formData.features?.map((feat: string, idx: number) => (
                    <li key={idx} className="flex items-center gap-2 bg-[#1A1A1A] p-2 rounded-lg border border-[#222]">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="flex-1 text-sm text-white">{feat}</span>
                      <button type="button" onClick={() => handleRemoveFeature(idx)} className="text-[#888] hover:text-red-500">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={featureInput}
                    onChange={e => setFeatureInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddFeature(); } }}
                    placeholder="Ajouter un point clé..."
                    className="flex-1 bg-[#0A0A0A] border border-[#222] rounded-lg p-2 text-sm text-white outline-none focus:border-[#FFBF00]"
                  />
                  <Button type="button" variant="secondary" onClick={handleAddFeature}>Ajouter</Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#222]">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPopular}
                    onChange={e => setFormData({ ...formData, isPopular: e.target.checked })}
                    className="w-4 h-4 rounded bg-[#222] border-[#444] text-[#FFBF00] focus:ring-[#FFBF00] focus:ring-offset-[#111]"
                  />
                  <span className="text-sm font-medium text-white">Mettre en avant (Populaire)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded bg-[#222] border-[#444] text-[#FFBF00] focus:ring-[#FFBF00] focus:ring-offset-[#111]"
                  />
                  <span className="text-sm font-medium text-white">Offre Active</span>
                </label>
              </div>
            </form>
            
            <div className="pt-6 border-t border-[#222] flex items-center justify-end gap-3 mt-auto">
              <Button type="button" variant="ghost" onClick={() => setIsEditing(null)} className="text-[#888] hover:text-white">
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="bg-[#FFBF00] text-black hover:bg-[#E5AB00] font-bold">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
