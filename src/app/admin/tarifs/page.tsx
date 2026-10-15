"use client";
import { AdminAction } from "@/components/admin/AdminAccess";

import React, { useState } from "react";
import useSWR from "swr";
import { adminApi } from "@/lib/api";
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Star,
  Package,
  Clock,
  Loader2,
  Radio,
  Building2,
  Users2,
  Crown,
  Trees,
  Sparkles,
  Eye,
  EyeOff,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";

function classNames(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

const COMMON_SPACES = [
  "Studio Principal / Annexe",
  "Salle de Conférence",
  "Salle VIP",
  "Extérieur",
];

export default function StudioOffersAdminPage() {
  const fetcher = (url: string) => adminApi(url).then((res) => res.data);
  const { data: offers, mutate, isLoading } = useSWR("/admin/studio-offers", fetcher);

  const [isEditing, setIsEditing] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [featureInput, setFeatureInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [statusTogglingId, setStatusTogglingId] = useState<string | null>(null);

  const packages = offers?.filter((o: any) => o.type === "PACKAGE") || [];
  const services = offers?.filter((o: any) => o.type === "SERVICE") || [];

  const handleOpenEdit = (offer?: any) => {
    if (offer) {
      setIsEditing(offer);
      setFormData({
        ...offer,
        features: offer.features || [],
      });
    } else {
      setIsEditing({ isNew: true });
      setFormData({
        type: "PACKAGE",
        name: "",
        price: "",
        unit: "FCFA / h",
        description: "",
        features: [],
        isPopular: false,
        isActive: true,
        order: (offers?.length || 0) + 1,
      });
    }
  };

  const handleAddFeature = (textToAdd?: string) => {
    const text = (textToAdd || featureInput).trim();
    if (!text) return;
    setFormData((prev: any) => ({
      ...prev,
      features: [...(prev.features || []), text],
    }));
    if (!textToAdd) setFeatureInput("");
  };

  const handleAddSpaceHelper = (spaceName: string) => {
    const samplePrice = spaceName.includes("Extérieur") ? "60 000 FCFA / h" : "25 000 FCFA / h";
    const line = `${spaceName} : ${samplePrice}`;
    handleAddFeature(line);
  };

  const handleRemoveFeature = (idx: number) => {
    setFormData((prev: any) => ({
      ...prev,
      features: prev.features.filter((_: any, i: number) => i !== idx),
    }));
  };

  const handleUpdateFeature = (idx: number, newVal: string) => {
    setFormData((prev: any) => {
      const copy = [...(prev.features || [])];
      copy[idx] = newVal;
      return { ...prev, features: copy };
    });
  };

  const handleToggleActive = async (offer: any) => {
    try {
      setStatusTogglingId(offer.id);
      await adminApi(`/admin/studio-offers/${offer.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !offer.isActive }),
      });
      await mutate();
    } catch (err: any) {
      alert("Erreur: " + err.message);
    } finally {
      setStatusTogglingId(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      if (isEditing.isNew) {
        await adminApi("/admin/studio-offers", {
          method: "POST",
          body: JSON.stringify(formData),
        });
      } else {
        await adminApi(`/admin/studio-offers/${isEditing.id}`, {
          method: "PATCH",
          body: JSON.stringify(formData),
        });
      }
      await mutate();
      setIsEditing(null);
    } catch (err: any) {
      alert("Erreur: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Voulez-vous vraiment supprimer l'offre "${name}" ?`)) return;
    try {
      await adminApi(`/admin/studio-offers/${id}`, { method: "DELETE" });
      await mutate();
    } catch (err: any) {
      alert("Erreur: " + err.message);
    }
  };

  return (
    <div className="w-full pb-32">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 border-b border-[#222222] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-lg bg-[#181818] text-[#FFBF00]">
              <Radio className="w-4 h-4" />
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">Tarification du Studio</h1>
          </div>
          <p className="text-sm text-[#888888]">
            Configurez les formules d'enregistrement (Enregistrement Brut, Formule Express) et les tarifs par salle/espace.
          </p>
        </div>

        <AdminAction permission="offers.create"><Button
          onClick={() => handleOpenEdit()}
          className="bg-[#FFBF00] text-black font-black hover:bg-[#E5AB00] transition-colors rounded-xl px-5 py-2.5 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Créer une Offre</span>
        </Button></AdminAction>
      </div>

      {isLoading && !offers ? (
        <div className="flex justify-center p-16">
          <Loader2 className="w-8 h-8 text-[#FFBF00] animate-spin" />
        </div>
      ) : offers?.length === 0 ? (
        <div className="text-center py-16 border border-[#222] border-dashed rounded-3xl bg-[#111]">
          <Package className="w-12 h-12 text-[#444] mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Aucune offre configurée</h3>
          <p className="text-sm text-[#888888] mb-6 max-w-sm mx-auto">
            Initialisez les formules d'enregistrement ou créez votre première offre de studio.
          </p>
          <AdminAction permission="offers.create"><Button onClick={() => handleOpenEdit()} className="bg-[#FFBF00] text-black font-bold">
            <Plus className="w-4 h-4 mr-2" />
            Créer la première offre
          </Button></AdminAction>
        </div>
      ) : (
        <div className="space-y-12">
          {/* 1. FORMULES D'ENREGISTREMENT STUDIO (PACKAGES) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#FFBF00]" />
                  <span>Formules d'Enregistrement Studio ({packages.length})</span>
                </h2>
                <p className="text-xs text-[#777777]">
                  Les formules présentées aux créateurs avec la grille tarifaire par espace.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {packages.map((pkg: any) => {
                const spaceRates: Array<{ label: string; price: string }> = [];
                const inclusions: string[] = [];

                if (Array.isArray(pkg.features)) {
                  pkg.features.forEach((feat: string) => {
                    if (feat.includes(" : ")) {
                      const [label, price] = feat.split(" : ");
                      spaceRates.push({ label: label.trim(), price: price.trim() });
                    } else {
                      inclusions.push(feat);
                    }
                  });
                }

                return (
                  <div
                    key={pkg.id}
                    className={classNames(
                      "relative bg-[#141414] border rounded-3xl p-6 transition-all flex flex-col justify-between",
                      pkg.isPopular ? "border-[#FFBF00]/70" : "border-[#262626]",
                      !pkg.isActive && "opacity-60"
                    )}
                  >
                    {pkg.isPopular && (
                      <div className="absolute -top-3 left-6 bg-[#FFBF00] text-black text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1 shadow">
                        <Star className="w-3 h-3 fill-black" />
                        Recommandé
                      </div>
                    )}

                    <div className="space-y-5">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#202020] text-[#A0A0A0] mb-2">
                            Formule Studio
                          </span>
                          <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
                          <p className="text-xs text-[#8E8E8E] mt-1 leading-relaxed">
                            {pkg.description}
                          </p>
                        </div>

                        {/* Top Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <AdminAction permission="offers.edit"><button
                            onClick={() => handleToggleActive(pkg)}
                            disabled={statusTogglingId === pkg.id}
                            title={pkg.isActive ? "Masquer l'offre" : "Activer l'offre"}
                            className="p-2 text-[#888] hover:text-white bg-[#1E1E1E] hover:bg-[#282828] rounded-xl transition-colors cursor-pointer"
                          >
                            {pkg.isActive ? (
                              <Eye className="w-4 h-4 text-green-400" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-red-400" />
                            )}
                          </button></AdminAction>
                          <AdminAction permission="offers.edit"><button
                            onClick={() => handleOpenEdit(pkg)}
                            title="Modifier l'offre"
                            className="p-2 text-[#888] hover:text-white bg-[#1E1E1E] hover:bg-[#282828] rounded-xl transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button></AdminAction>
                          <AdminAction permission="offers.delete"><button
                            onClick={() => handleDelete(pkg.id, pkg.name)}
                            title="Supprimer l'offre"
                            className="p-2 text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button></AdminAction>
                        </div>
                      </div>

                      {/* Prix d'appel */}
                      <div className="p-3 rounded-2xl bg-[#1A1A1A] border border-[#242424] flex items-baseline justify-between">
                        <span className="text-xs text-[#808080] font-medium">Prix d'appel (dès) :</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-black text-[#FFBF00] font-mono">{pkg.price}</span>
                          <span className="text-xs text-[#808080]">{pkg.unit}</span>
                        </div>
                      </div>

                      {/* Tarifs par espace / salle */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-[#666666] uppercase tracking-wider block">
                          Tarifs par salle configurés :
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {spaceRates.map((space, idx) => (
                            <div
                              key={idx}
                              className="px-3 py-2 rounded-xl bg-[#1B1B1B] border border-[#262626] flex items-center justify-between text-xs"
                            >
                              <span className="text-[#CCC] font-medium truncate mr-2">{space.label}</span>
                              <span className="text-[#FFBF00] font-bold font-mono shrink-0">{space.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Inclusions */}
                      {inclusions.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-[#1F1F1F]">
                          <span className="text-[10px] font-bold text-[#666666] uppercase tracking-wider block">
                            Avantages inclus :
                          </span>
                          <ul className="space-y-1.5">
                            {inclusions.map((inc, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-[#A0A0A0]">
                                <Check className="w-3.5 h-3.5 text-[#FFBF00] shrink-0 mt-0.5" />
                                <span>{inc}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 mt-4 border-t border-[#202020] flex items-center justify-between text-[11px] text-[#707070]">
                      <span>Ordre : {pkg.order}</span>
                      <span className={pkg.isActive ? "text-green-500 font-bold" : "text-neutral-500"}>
                        {pkg.isActive ? "● En ligne sur /tarifs" : "○ Masquée"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. SERVICES ADDITIONNELS & PRESTATIONS À LA CARTE */}
          <div className="space-y-4 pt-6 border-t border-[#222222]">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FFBF00]" />
                <span>Prestations à la Carte & Post-production ({services.length})</span>
              </h2>
              <p className="text-xs text-[#777777]">
                Options additionnelles (montage, packs réseaux sociaux, coaching) sélectionnables par les clients.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {services.map((service: any) => (
                <div
                  key={service.id}
                  className={classNames(
                    "bg-[#141414] border border-[#242424] rounded-2xl p-5 flex flex-col justify-between transition-all",
                    !service.isActive && "opacity-60"
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-base font-bold text-white">{service.name}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <AdminAction permission="offers.edit"><button
                          onClick={() => handleToggleActive(service)}
                          disabled={statusTogglingId === service.id}
                          className="p-1.5 text-[#888] hover:text-white bg-[#1E1E1E] rounded-lg transition-colors cursor-pointer"
                        >
                          {service.isActive ? (
                            <Eye className="w-3.5 h-3.5 text-green-400" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5 text-red-400" />
                          )}
                        </button></AdminAction>
                        <AdminAction permission="offers.edit"><button
                          onClick={() => handleOpenEdit(service)}
                          className="p-1.5 text-[#888] hover:text-white bg-[#1E1E1E] rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button></AdminAction>
                        <AdminAction permission="offers.delete"><button
                          onClick={() => handleDelete(service.id, service.name)}
                          className="p-1.5 text-red-400 hover:text-red-300 bg-red-950/20 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button></AdminAction>
                      </div>
                    </div>

                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-black text-[#FFBF00] font-mono">{service.price}</span>
                      {service.unit && <span className="text-xs text-[#777]">{service.unit}</span>}
                    </div>

                    <p className="text-xs text-[#8E8E8E] leading-relaxed line-clamp-2">
                      {service.description}
                    </p>

                    {Array.isArray(service.features) && service.features.length > 0 && (
                      <ul className="space-y-1.5 pt-2 border-t border-[#1E1E1E]">
                        {service.features.map((f: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-[11px] text-[#A0A0A0]">
                            <Check className="w-3 h-3 text-[#FFBF00] shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="pt-3 mt-3 border-t border-[#1C1C1C] flex items-center justify-between text-[11px] text-[#707070]">
                    <span>Ordre : {service.order}</span>
                    <span className={service.isActive ? "text-green-500 font-bold" : "text-neutral-500"}>
                      {service.isActive ? "Actif" : "Masqué"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CRÉATION / MODIFICATION */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsEditing(null)} />
          <div className="relative bg-[#141414] border border-[#282828] w-full max-w-xl rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <h2 className="text-xl font-headline font-black text-white mb-6 border-b border-[#242424] pb-4">
              {isEditing.isNew ? "Créer une nouvelle offre" : `Modifier l'offre : ${formData.name || ""}`}
            </h2>

            <AdminAction permission={isEditing?.id ? "offers.edit" : "offers.create"}><form onSubmit={handleSave} className="overflow-y-auto pr-2 space-y-5 pb-4 custom-scrollbar flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#888] uppercase mb-1">Catégorie</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#FFBF00]"
                  >
                    <option value="PACKAGE">Formule Studio (Package)</option>
                    <option value="SERVICE">Service à la carte (Post-prod / Prestation)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#888] uppercase mb-1">Nom de la formule *</label>
                  <input
                    required
                    type="text"
                    value={formData.name || ""}
                    placeholder="Ex: Enregistrement Brut"
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#FFBF00]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#888] uppercase mb-1">
                    Prix de base (ex: 20 000) *
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.price || ""}
                    placeholder="Ex: 20 000"
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#FFBF00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#888] uppercase mb-1">Unité (ex: FCFA / h)</label>
                  <input
                    type="text"
                    value={formData.unit || ""}
                    placeholder="Ex: FCFA / h ou FCFA / épisode"
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#FFBF00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#888] uppercase mb-1">Description courte *</label>
                <textarea
                  required
                  rows={2}
                  value={formData.description || ""}
                  placeholder="Ex: Pour ceux qui souhaitent récupérer leurs fichiers audio et vidéo afin de réaliser leur propre montage."
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#FFBF00] resize-none"
                />
              </div>

              {/* ASSISTANT D'AJOUT RAPIDE DES TARIFS PAR SALLE */}
              {formData.type === "PACKAGE" && (
                <div className="p-3.5 rounded-2xl bg-[#181818] border border-[#282828] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#FFBF00] uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Ajouter un tarif de salle</span>
                    </span>
                    <span className="text-[10px] text-[#777]">Format: Nom de salle : Prix</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_SPACES.map((space) => (
                      <button
                        key={space}
                        type="button"
                        onClick={() => handleAddSpaceHelper(space)}
                        className="px-2.5 py-1 rounded-lg bg-[#222222] hover:bg-[#2A2A2A] border border-[#333333] hover:border-[#FFBF00]/50 text-white text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3 text-[#FFBF00]" />
                        <span>{space}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* LISTE DES TARIFS DE SALLES & AVANTAGES */}
              <div>
                <label className="block text-xs font-bold text-[#888] uppercase mb-2">
                  Tarifs par salle & Avantages inclus ({formData.features?.length || 0})
                </label>
                <ul className="space-y-2 mb-3 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                  {formData.features?.map((feat: string, idx: number) => {
                    const isSpaceRate = feat.includes(" : ");
                    return (
                      <li
                        key={idx}
                        className={classNames(
                          "flex items-center gap-2 p-2.5 rounded-xl border text-xs",
                          isSpaceRate
                            ? "bg-[#1E1E1E] border-[#FFBF00]/30"
                            : "bg-[#181818] border-[#2A2A2A]"
                        )}
                      >
                        <span className="text-[#FFBF00] shrink-0">
                          {isSpaceRate ? <Building2 className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                        </span>
                        <input
                          type="text"
                          value={feat}
                          onChange={(e) => handleUpdateFeature(idx, e.target.value)}
                          className="flex-1 bg-transparent text-white outline-none focus:underline"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(idx)}
                          className="text-[#777] hover:text-red-400 p-1 transition-colors"
                          title="Supprimer cette ligne"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    placeholder="Ajouter une salle ou un avantage (ex: Studio VIP : 25 000 FCFA / h)..."
                    className="flex-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FFBF00]"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleAddFeature()}
                    className="bg-[#242424] hover:bg-[#303030] text-white text-xs font-bold rounded-xl"
                  >
                    Ajouter
                  </Button>
                </div>
              </div>

              {/* OPTIONS TOGGLE */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#242424]">
                <div>
                  <label className="block text-xs font-bold text-[#888] uppercase mb-1">Ordre d'affichage</label>
                  <input
                    type="number"
                    value={formData.order ?? 0}
                    onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-2 text-xs text-white outline-none focus:border-[#FFBF00]"
                  />
                </div>

                <label className="flex items-center gap-3 cursor-pointer pt-4">
                  <input
                    type="checkbox"
                    checked={formData.isPopular || false}
                    onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                    className="w-4 h-4 rounded bg-[#222] border-[#444] text-[#FFBF00] focus:ring-[#FFBF00]"
                  />
                  <span className="text-xs font-medium text-white">Recommandé (Star)</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer pt-4">
                  <input
                    type="checkbox"
                    checked={formData.isActive !== undefined ? formData.isActive : true}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded bg-[#222] border-[#444] text-[#FFBF00] focus:ring-[#FFBF00]"
                  />
                  <span className="text-xs font-medium text-white">Afficher en ligne</span>
                </label>
              </div>
            </form></AdminAction>

            <div className="pt-6 border-t border-[#242424] flex items-center justify-end gap-3 mt-auto">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditing(null)}
                className="text-[#888] hover:text-white"
              >
                Annuler
              </Button>
              <AdminAction permission={isEditing?.id ? "offers.edit" : "offers.create"}><Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-[#FFBF00] text-black hover:bg-[#E5AB00] font-black rounded-xl px-6"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Enregistrer les Tarifs
              </Button></AdminAction>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
