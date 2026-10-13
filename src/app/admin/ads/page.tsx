"use client";

import React, { useState } from "react";
import useSWR, { mutate } from "swr";
import Image from "next/image";
import { fetchApi } from "@/lib/api";
import { 
  Megaphone, Plus, Eye, MousePointerClick, TrendingUp, 
  Calendar, CheckCircle2, AlertCircle, X, Trash2, 
  ExternalLink, Mail, Phone, Building2, Clock, Check, RefreshCw
} from "lucide-react";

const fetcher = (url: string) => fetchApi(url).then((res) => res.data);

export default function AdminAdsPage() {
  const [activeTab, setActiveTab] = useState<"campaigns" | "inquiries">("campaigns");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Queries
  const { data: campaigns, isLoading: isCampaignsLoading } = useSWR<any[]>(
    "/admin/ads",
    fetcher
  );
  const { data: inquiries, isLoading: isInquiriesLoading } = useSWR<any[]>(
    "/admin/advertiser-inquiries",
    fetcher
  );

  // Form State
  const [formData, setFormData] = useState({
    advertiserName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    title: "",
    description: "",
    ctaLabel: "En savoir plus",
    targetUrl: "",
    imageUrlDesktop: "",
    imageUrlMobile: "",
    altText: "",
    placement: "EXPLORE_CATALOG",
    isSponsored: true,
    status: "ACTIVE",
    priority: 0,
    startsAt: "",
    endsAt: "",
  });

  const totalImpressions = campaigns?.reduce((acc, c) => acc + (c.impressionsCount || 0), 0) || 0;
  const totalClicks = campaigns?.reduce((acc, c) => acc + (c.clicksCount || 0), 0) || 0;
  const averageCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00";
  const pendingInquiriesCount = inquiries?.filter((i) => i.status === "PENDING").length || 0;

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      const res = await fetchApi("/admin/ads", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          priority: Number(formData.priority) || 0,
          startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : null,
          endsAt: formData.endsAt ? new Date(formData.endsAt).toISOString() : null,
        }),
      });

      if (!res.success) {
        throw new Error(res.error?.message || "Échec de création de la campagne");
      }

      setIsModalOpen(false);
      setFormData({
        advertiserName: "",
        contactName: "",
        contactEmail: "",
        contactPhone: "",
        title: "",
        description: "",
        ctaLabel: "En savoir plus",
        targetUrl: "",
        imageUrlDesktop: "",
        imageUrlMobile: "",
        altText: "",
        placement: "EXPLORE_CATALOG",
        isSponsored: true,
        status: "ACTIVE",
        priority: 0,
        startsAt: "",
        endsAt: "",
      });
      mutate("/admin/ads");
      mutate("/ads/active");
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur de connexion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCampaignStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await fetchApi(`/admin/ads/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      mutate("/admin/ads");
      mutate("/ads/active");
    } catch (err) {
      console.error(err);
    }
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette campagne ?")) return;
    try {
      await fetchApi(`/admin/ads/${id}`, { method: "DELETE" });
      mutate("/admin/ads");
      mutate("/ads/active");
    } catch (err) {
      console.error(err);
    }
  };

  const updateInquiryStatus = async (id: string, newStatus: string) => {
    try {
      await fetchApi(`/admin/advertiser-inquiries/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      mutate("/admin/advertiser-inquiries");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-white pb-24">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-headline tracking-tight text-white flex items-center gap-2.5">
            <Megaphone className="w-6 h-6 text-[#FFBF00]" />
            Régie & Campagnes Publicitaires
          </h1>
          <p className="text-xs text-[#A0A0A0] mt-1">
            Gérez les emplacements commerciaux d'Explorer, analysez les performances et traitez les demandes annonceurs.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FFBF00] text-[#0B0B0B] font-bold text-xs hover:bg-[#e6ac00] transition-colors shadow-sm self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Nouvelle Campagne
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#141414] border border-[#222222]">
          <span className="text-[11px] font-semibold text-[#888888] uppercase tracking-wider block mb-1">
            Campagnes Actives
          </span>
          <div className="text-2xl font-black text-white">
            {campaigns?.filter((c) => c.status === "ACTIVE").length || 0}
            <span className="text-xs font-normal text-[#666666] ml-2">/ {campaigns?.length || 0}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#141414] border border-[#222222]">
          <span className="text-[11px] font-semibold text-[#888888] uppercase tracking-wider block mb-1 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-[#FFBF00]" />
            Impressions Réelles
          </span>
          <div className="text-2xl font-black text-white">
            {totalImpressions.toLocaleString()}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#141414] border border-[#222222]">
          <span className="text-[11px] font-semibold text-[#888888] uppercase tracking-wider block mb-1 flex items-center gap-1.5">
            <MousePointerClick className="w-3.5 h-3.5 text-[#FFBF00]" />
            Clics Enregistrés
          </span>
          <div className="text-2xl font-black text-white">
            {totalClicks.toLocaleString()}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#141414] border border-[#222222]">
          <span className="text-[11px] font-semibold text-[#888888] uppercase tracking-wider block mb-1 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-[#22c55e]" />
            Taux de Clic (CTR)
          </span>
          <div className="text-2xl font-black text-[#22c55e]">
            {averageCtr}%
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-[#222222] pb-3 text-xs">
        <button
          onClick={() => setActiveTab("campaigns")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
            activeTab === "campaigns"
              ? "bg-[#1E1E1E] text-[#FFBF00] border border-[#333333]"
              : "text-[#888888] hover:text-white"
          }`}
        >
          <Megaphone className="w-4 h-4" />
          Campagnes ({campaigns?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("inquiries")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all relative ${
            activeTab === "inquiries"
              ? "bg-[#1E1E1E] text-[#FFBF00] border border-[#333333]"
              : "text-[#888888] hover:text-white"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Demandes Annonceurs ({inquiries?.length || 0})
          {pendingInquiriesCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[#FFBF00] text-[#0B0B0B] text-[10px] font-black">
              {pendingInquiriesCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: CAMPAIGNS */}
      {activeTab === "campaigns" && (
        <div className="space-y-4">
          {isCampaignsLoading ? (
            <div className="p-12 text-center text-[#757575] text-xs">Chargement des campagnes...</div>
          ) : !campaigns || campaigns.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#141414] border border-[#222222] space-y-3">
              <Megaphone className="w-10 h-10 text-[#444444] mx-auto" />
              <p className="text-sm font-semibold text-white">Aucune campagne publicitaire</p>
              <p className="text-xs text-[#757575]">
                Créez une première bannière sponsorisée pour les emplacements de découverte.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFBF00] text-[#0B0B0B] font-bold text-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Créer une campagne
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {campaigns.map((camp) => {
                const ctr =
                  camp.impressionsCount > 0
                    ? ((camp.clicksCount / camp.impressionsCount) * 100).toFixed(2)
                    : "0.00";

                return (
                  <div
                    key={camp.id}
                    className="p-4 rounded-xl bg-[#141414] border border-[#222222] flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-[#333333] transition-all"
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="relative w-28 h-16 rounded-lg overflow-hidden shrink-0 bg-[#222222] border border-[#333333]">
                        {camp.imageUrlDesktop ? (
                          <Image
                            unoptimized
                            src={camp.imageUrlDesktop}
                            alt={camp.altText || camp.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#555555]">
                            <Megaphone className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-[#FFBF00] uppercase tracking-wider">
                            {camp.advertiserName}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              camp.status === "ACTIVE"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : camp.status === "SCHEDULED"
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                            }`}
                          >
                            {camp.status}
                          </span>
                          {camp.isSponsored && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#222222] text-[#888888]">
                              Sponsorisé
                            </span>
                          )}
                          <span className="text-[10px] text-[#666666]">
                            Emplacement: {camp.placement}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-white truncate max-w-xl">
                          {camp.title}
                        </h3>

                        {camp.description && (
                          <p className="text-xs text-[#888888] line-clamp-1 max-w-xl">
                            {camp.description}
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-[11px] text-[#666666] pt-1">
                          <a
                            href={camp.targetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#FFBF00] hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {camp.targetUrl}
                          </a>
                          <span>•</span>
                          <span>Priorité: {camp.priority}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#222222]">
                      <div className="flex items-center gap-4 text-center">
                        <div>
                          <span className="text-[10px] text-[#666666] uppercase block">Impressions</span>
                          <span className="text-sm font-black text-white">{camp.impressionsCount}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#666666] uppercase block">Clics</span>
                          <span className="text-sm font-black text-white">{camp.clicksCount}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#666666] uppercase block">CTR</span>
                          <span className="text-sm font-black text-[#22c55e]">{ctr}%</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleCampaignStatus(camp.id, camp.status)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            camp.status === "ACTIVE"
                              ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                              : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                          }`}
                        >
                          {camp.status === "ACTIVE" ? "Suspendre" : "Activer"}
                        </button>
                        <button
                          onClick={() => deleteCampaign(camp.id)}
                          className="p-1.5 text-[#666666] hover:text-red-400 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INQUIRIES */}
      {activeTab === "inquiries" && (
        <div className="space-y-4">
          {isInquiriesLoading ? (
            <div className="p-12 text-center text-[#757575] text-xs">Chargement des demandes...</div>
          ) : !inquiries || inquiries.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#141414] border border-[#222222] space-y-2">
              <Building2 className="w-10 h-10 text-[#444444] mx-auto" />
              <p className="text-sm font-semibold text-white">Aucune demande reçue</p>
              <p className="text-xs text-[#757575]">
                Les propositions transmises via le formulaire public "Annoncer sur Bamako Podcast" apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inquiries.map((inq) => (
                <div
                  key={inq.id}
                  className="p-5 rounded-2xl bg-[#141414] border border-[#222222] space-y-3.5 hover:border-[#333333] transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-black text-[#FFBF00] uppercase tracking-wider block">
                        {inq.company}
                      </span>
                      <h4 className="text-sm font-bold text-white">{inq.contactName}</h4>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        inq.status === "PENDING"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : inq.status === "CONTACTED"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                      }`}
                    >
                      {inq.status === "PENDING"
                        ? "En attente"
                        : inq.status === "CONTACTED"
                        ? "Contacté"
                        : "Archivé"}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-[#A0A0A0]">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#666666]" />
                      <a href={`mailto:${inq.email}`} className="text-white hover:underline">
                        {inq.email}
                      </a>
                    </div>
                    {inq.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#666666]" />
                        <span>{inq.phone}</span>
                      </div>
                    )}
                    {(inq.targetPeriod || inq.budget) && (
                      <div className="flex items-center gap-4 text-[11px] text-[#888888] pt-1">
                        {inq.targetPeriod && <span>Période: {inq.targetPeriod}</span>}
                        {inq.budget && <span>Budget: {inq.budget}</span>}
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[#262626] text-xs text-[#D0D0D0] leading-relaxed">
                    "{inq.message}"
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#222222]">
                    <span className="text-[#666666]">
                      Reçu le {new Date(inq.createdAt).toLocaleDateString("fr-FR")}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {inq.status === "PENDING" && (
                        <button
                          onClick={() => updateInquiryStatus(inq.id, "CONTACTED")}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-semibold transition-colors"
                        >
                          Marquer contacté
                        </button>
                      )}
                      {inq.status !== "ARCHIVED" && (
                        <button
                          onClick={() => updateInquiryStatus(inq.id, "ARCHIVED")}
                          className="px-2.5 py-1 rounded-lg bg-[#222222] text-[#888888] hover:text-white text-xs transition-colors"
                        >
                          Archiver
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-[#141414] border border-[#2A2A2A] rounded-2xl shadow-2xl p-6 overflow-y-auto max-h-[90vh] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[#FFBF00]" />
                <h3 className="text-base font-bold text-white">Nouvelle Campagne Sponsorisée</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-[#757575] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-[#A0A0A0]">Nom de l'Annonceur *</label>
                  <input
                    type="text"
                    required
                    value={formData.advertiserName}
                    onChange={(e) => setFormData({ ...formData, advertiserName: e.target.value })}
                    placeholder="Ex: Orange Mali, Banque Atlantique..."
                    className="w-full px-3 py-2.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white focus:border-[#FFBF00] outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-[#A0A0A0]">Titre de la Campagne *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Forfaits Fibre & 5G pour créateurs"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white focus:border-[#FFBF00] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#A0A0A0]">Texte descriptif / Accroche</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Courte description de l'offre (affichée sur la bannière)..."
                  className="w-full px-3 py-2.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white focus:border-[#FFBF00] outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-[#A0A0A0]">URL de destination (Clic) *</label>
                  <input
                    type="text"
                    required
                    value={formData.targetUrl}
                    onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                    placeholder="https://... ou /tarifs"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white focus:border-[#FFBF00] outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-[#A0A0A0]">Libellé du Bouton</label>
                  <input
                    type="text"
                    value={formData.ctaLabel}
                    onChange={(e) => setFormData({ ...formData, ctaLabel: e.target.value })}
                    placeholder="En savoir plus, Découvrir..."
                    className="w-full px-3 py-2.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white focus:border-[#FFBF00] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-[#A0A0A0]">Visuel Ordinateur (Desktop) *</label>
                  <input
                    type="url"
                    required
                    value={formData.imageUrlDesktop}
                    onChange={(e) => setFormData({ ...formData, imageUrlDesktop: e.target.value })}
                    placeholder="https://... bannière paysage"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white focus:border-[#FFBF00] outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-[#A0A0A0]">Visuel Téléphone (Mobile, facultatif)</label>
                  <input
                    type="url"
                    value={formData.imageUrlMobile}
                    onChange={(e) => setFormData({ ...formData, imageUrlMobile: e.target.value })}
                    placeholder="https://... visuel format compact"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white focus:border-[#FFBF00] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-[#A0A0A0]">Emplacement</label>
                  <select
                    value={formData.placement}
                    onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white focus:border-[#FFBF00] outline-none"
                  >
                    <option value="EXPLORE_CATALOG">Catalogue Explorer</option>
                    <option value="EXPLORE_FOOTER">Bas de page Explorer</option>
                    <option value="ALL">Partout</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-[#A0A0A0]">Priorité de rotation</label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white focus:border-[#FFBF00] outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-[#A0A0A0]">Statut initial</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white focus:border-[#FFBF00] outline-none"
                  >
                    <option value="ACTIVE">Actif (en diffusion)</option>
                    <option value="DRAFT">Brouillon</option>
                    <option value="SUSPENDED">Suspendu</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-[#D0D0D0]">
                  <input
                    type="checkbox"
                    checked={formData.isSponsored}
                    onChange={(e) => setFormData({ ...formData, isSponsored: e.target.checked })}
                    className="accent-[#FFBF00] w-4 h-4 rounded"
                  />
                  Afficher la mention explicite "Sponsorisé" / "Publicité"
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#1E1E1E] text-[#A0A0A0] hover:text-white font-semibold transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#FFBF00] text-[#0B0B0B] font-bold hover:bg-[#e6ac00] transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Enregistrement..." : "Créer et diffuser"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
