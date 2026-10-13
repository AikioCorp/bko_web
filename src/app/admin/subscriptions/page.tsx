"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { adminApi } from "@/lib/adminApi";
import {
  Crown,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Loader2,
  AlertCircle,
  HelpCircle,
  Layers,
  X,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  isActive: boolean;
  scope: string;
  _count?: {
    subscriptions: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function AdminSubscriptionsPage() {
  const { data: plans, mutate, isLoading, error } = useSWR<SubscriptionPlan[]>(
    "/admin/subscription-plans",
    (url: string) => adminApi<SubscriptionPlan[]>(url)
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [featureInput, setFeatureInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    price: 2000,
    currency: "XOF",
    interval: "MONTHLY",
    description: "",
    features: [] as string[],
    isActive: true,
  });

  const flash = (msg: string, isErr = false) => {
    if (isErr) {
      setActionError(msg);
      setTimeout(() => setActionError(""), 4000);
    } else {
      setActionSuccess(msg);
      setTimeout(() => setActionSuccess(""), 4000);
    }
  };

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setFormData({
      name: "",
      slug: "",
      price: 2000,
      currency: "XOF",
      interval: "MONTHLY",
      description: "",
      features: [
        "Écoute sans coupures publicitaires",
        "Accès à 100% des épisodes exclusifs",
        "Téléchargement hors-ligne illimité",
      ],
      isActive: true,
    });
    setFeatureInput("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      slug: plan.slug,
      price: plan.price,
      currency: plan.currency || "XOF",
      interval: plan.interval || "MONTHLY",
      description: plan.description || "",
      features: [...plan.features],
      isActive: plan.isActive,
    });
    setFeatureInput("");
    setIsModalOpen(true);
  };

  const handleAddFeature = () => {
    const trimmed = featureInput.trim();
    if (!trimmed) return;
    if (formData.features.includes(trimmed)) return;
    setFormData((prev) => ({ ...prev, features: [...prev.features, trimmed] }));
    setFeatureInput("");
  };

  const handleRemoveFeature = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== idx),
    }));
  };

  const handleToggleActive = async (plan: SubscriptionPlan) => {
    try {
      await adminApi(`/admin/subscription-plans/${plan.id}/toggle`, {
        method: "PATCH",
      });
      flash(
        plan.isActive
          ? `La formule « ${plan.name} » est maintenant masquée du public.`
          : `La formule « ${plan.name} » est désormais visible en ligne.`
      );
      await mutate();
    } catch (err: any) {
      flash(err.message || "Erreur lors du changement de statut", true);
    }
  };

  const handleDeletePlan = async (plan: SubscriptionPlan) => {
    const subCount = plan._count?.subscriptions || 0;
    const confirmMsg =
      subCount > 0
        ? `Cette formule compte ${subCount} abonné(s) actif(s). Elle sera désactivée pour préserver l'historique sans casser leurs droits. Continuer ?`
        : `Voulez-vous vraiment supprimer définitivement la formule « ${plan.name} » ?`;

    if (!confirm(confirmMsg)) return;

    try {
      await adminApi(`/admin/subscription-plans/${plan.id}`, {
        method: "DELETE",
      });
      flash(`Formule « ${plan.name} » retirée.`);
      await mutate();
    } catch (err: any) {
      flash(err.message || "Erreur lors de la suppression", true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      flash("Le nom de la formule est obligatoire.", true);
      return;
    }
    if (formData.price < 0) {
      flash("Le prix doit être positif.", true);
      return;
    }

    setIsSaving(true);
    try {
      if (editingPlan) {
        await adminApi(`/admin/subscription-plans/${editingPlan.id}`, {
          method: "PATCH",
          body: formData,
        });
        flash(`Formule « ${formData.name} » mise à jour.`);
      } else {
        await adminApi("/admin/subscription-plans", {
          method: "POST",
          body: formData,
        });
        flash(`Nouvelle formule « ${formData.name} » créée.`);
      }
      setIsModalOpen(false);
      await mutate();
    } catch (err: any) {
      flash(err.message || "Impossible d'enregistrer la formule.", true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full pb-32 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#222222] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-[#18160E] border border-[#FFBF00]/40 flex items-center justify-center text-[#FFBF00]">
              <Crown className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Abonnements & Pass Premium
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#888888]">
            Configurez les tarifs, masquez ou affichez les formules en direct pour le public et personnalisez les avantages.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold text-xs rounded-xl shadow-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Formule</span>
        </Button>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#222222]">
          <span className="text-xs text-[#777777] font-medium">Formules actives</span>
          <p className="text-2xl font-black text-white mt-1">
            {plans?.filter((p) => p.isActive).length ?? 0}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#222222]">
          <span className="text-xs text-[#777777] font-medium">Formules masquées</span>
          <p className="text-2xl font-black text-[#A0A0A0] mt-1">
            {plans?.filter((p) => !p.isActive).length ?? 0}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#222222]">
          <span className="text-xs text-[#777777] font-medium">Total souscriptions</span>
          <p className="text-2xl font-black text-[#FFBF00] mt-1">
            {plans?.reduce((acc, p) => acc + (p._count?.subscriptions || 0), 0) ?? 0}
          </p>
        </div>
      </div>

      {/* Plans List */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-[#FFBF00] animate-spin" />
          <span className="text-xs text-[#777777]">Chargement des formules...</span>
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-[#141414] border border-red-900/40 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <p className="text-sm font-bold text-white">Erreur de chargement</p>
          <p className="text-xs text-[#888888]">{error.message}</p>
        </div>
      ) : plans && plans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                plan.isActive
                  ? "bg-[#141414] border-[#2A2A2A] hover:border-[#FFBF00]/40"
                  : "bg-[#101010] border-[#1F1F1F] opacity-75"
              }`}
            >
              <div className="space-y-4">
                {/* En-tête de carte */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-white">{plan.name}</h3>
                    </div>
                    <span className="text-[11px] font-mono text-[#777777]">
                      /{plan.slug}
                    </span>
                  </div>

                  {/* Badge statut visibilité */}
                  <button
                    onClick={() => handleToggleActive(plan)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                      plan.isActive
                        ? "bg-emerald-950/60 border-emerald-800/80 text-emerald-400 hover:bg-emerald-900/80"
                        : "bg-[#1C1C1C] border-[#333333] text-[#888888] hover:text-white"
                    }`}
                    title={plan.isActive ? "Cliquer pour masquer du site" : "Cliquer pour afficher sur le site"}
                  >
                    {plan.isActive ? (
                      <>
                        <Eye className="w-3 h-3" />
                        <span>Visible</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3" />
                        <span>Masqué</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Prix et récurrence */}
                <div className="p-3 rounded-xl bg-[#0C0C0C] border border-[#1E1E1E]">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-[#FFBF00]">
                      {plan.price.toLocaleString("fr-FR")}
                    </span>
                    <span className="text-xs font-bold text-white">FCFA</span>
                    <span className="text-[11px] text-[#777777]">
                      {plan.interval === "YEARLY"
                        ? "/ an"
                        : plan.interval === "LIFETIME"
                        ? "à vie"
                        : "/ mois"}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#888888] mt-1">
                    {plan._count?.subscriptions ?? 0} auditeur(s) abonné(s)
                  </div>
                </div>

                {/* Description */}
                {plan.description && (
                  <p className="text-xs text-[#999999] leading-relaxed line-clamp-2">
                    {plan.description}
                  </p>
                )}

                {/* Liste des fonctionnalités */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-[#666666] uppercase tracking-wider">
                    Avantages inclus ({plan.features.length})
                  </span>
                  <ul className="space-y-1">
                    {plan.features.slice(0, 4).map((f, i) => (
                      <li key={i} className="text-xs text-[#CCCCCC] flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#FFBF00] shrink-0 mt-0.5" />
                        <span className="truncate">{f}</span>
                      </li>
                    ))}
                    {plan.features.length > 4 && (
                      <li className="text-[11px] text-[#777777] italic pl-5">
                        +{plan.features.length - 4} autres avantages...
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Actions de bas de carte */}
              <div className="pt-5 mt-5 border-t border-[#1F1F1F] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleActive(plan)}
                  className="text-xs font-semibold text-[#888888] hover:text-white flex items-center gap-1.5"
                >
                  {plan.isActive ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Masquer</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Publier</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(plan)}
                    className="p-2 rounded-lg bg-[#1C1C1C] hover:bg-[#252525] border border-[#2E2E2E] text-[#CCCCCC] hover:text-white transition-colors"
                    title="Modifier la formule"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeletePlan(plan)}
                    className="p-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-900/60 text-red-400 hover:text-red-300 transition-colors"
                    title="Supprimer la formule"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-16 rounded-3xl bg-[#141414] border border-[#222222] text-center space-y-4">
          <Crown className="w-12 h-12 text-[#FFBF00]/60 mx-auto" />
          <h2 className="text-lg font-bold text-white">Aucune formule configurée</h2>
          <p className="text-xs text-[#888888] max-w-md mx-auto">
            Créez votre première offre d'abonnement pour permettre à vos auditeurs de soutenir le média et d'écouter en illimité.
          </p>
          <Button
            onClick={handleOpenCreate}
            className="bg-[#FFBF00] text-[#0B0B0B] font-bold text-xs"
          >
            Créer un Pass Premium
          </Button>
        </div>
      )}

      {/* Modal Formulaire de Création / Édition */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-xl bg-[#121212] border border-[#262626] rounded-3xl shadow-2xl overflow-hidden animate-fade-in max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#222222] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-[#FFBF00]" />
                <h3 className="font-bold text-lg text-white">
                  {editingPlan ? `Modifier : ${editingPlan.name}` : "Nouvelle Formule d'Abonnement"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-[#777777] hover:text-white bg-[#1A1A1A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Nom & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#CCCCCC]">Nom de la formule *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ex: Pass Bamako Illimité"
                    className="w-full bg-[#0E0E0E] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#FFBF00]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#CCCCCC]">Identifiant (Slug)</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="pass-illimite-mensuel"
                    className="w-full bg-[#0E0E0E] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#FFBF00] font-mono"
                  />
                </div>
              </div>

              {/* Prix & Intervalle */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#CCCCCC]">Prix (FCFA) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={100}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full bg-[#0E0E0E] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-xs text-white font-bold outline-none focus:border-[#FFBF00]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#CCCCCC]">Périodicité</label>
                  <select
                    value={formData.interval}
                    onChange={(e) => setFormData({ ...formData, interval: e.target.value })}
                    className="w-full bg-[#0E0E0E] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#FFBF00] cursor-pointer"
                  >
                    <option value="MONTHLY">Mensuel (/ mois)</option>
                    <option value="YEARLY">Annuel (/ an)</option>
                    <option value="LIFETIME">À vie (Paiement unique)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#CCCCCC]">Devise</label>
                  <input
                    type="text"
                    disabled
                    value={formData.currency}
                    className="w-full bg-[#181818] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-xs text-[#888888] outline-none"
                  />
                </div>
              </div>

              {/* Statut Affichage */}
              <div className="p-3 rounded-xl bg-[#0E0E0E] border border-[#242424] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white">Visibilité publique</span>
                  <p className="text-[11px] text-[#777777]">
                    Si coché, cette offre apparaît sur la page publique /premium et les paywalls.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 accent-[#FFBF00] rounded cursor-pointer"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#CCCCCC]">Description commerciale</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Accès à tous les épisodes réservés aux membres, streaming haute fidélité..."
                  className="w-full bg-[#0E0E0E] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#FFBF00]"
                />
              </div>

              {/* Avantages inclus */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#CCCCCC]">Avantages & fonctionnalités</label>
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
                    placeholder="Ajouter un avantage (ex: Écoute sans publicité)"
                    className="flex-1 bg-[#0E0E0E] border border-[#2A2A2A] rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-[#FFBF00]"
                  />
                  <Button
                    type="button"
                    onClick={handleAddFeature}
                    className="bg-[#242424] hover:bg-[#303030] text-white text-xs rounded-xl"
                  >
                    Ajouter
                  </Button>
                </div>

                <div className="space-y-1.5 pt-1">
                  {formData.features.map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-[#1A1A1A] border border-[#262626] text-xs text-white"
                    >
                      <span className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#FFBF00]" />
                        <span>{feat}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        className="text-[#777777] hover:text-red-400 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-[#222222] flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="border-[#2A2A2A] text-[#888888] hover:text-white"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold text-xs"
                >
                  {isSaving ? "Enregistrement..." : editingPlan ? "Mettre à jour" : "Créer la formule"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
