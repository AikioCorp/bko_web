"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import { 
  Settings, 
  Mic2, 
  Globe, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  DollarSign,
  Bell,
  Share2,
  ShieldCheck,
  CreditCard,
  Phone
} from "lucide-react";
import { fetchApi } from "@/lib/api";

const fetcher = (url: string) => fetchApi(url).then((res) => res.data);

export default function StudioSettingsPage() {
  const { data: creatorProfile, isLoading, mutate } = useSWR("/me/creator-profile", fetcher);

  const [activeTab, setActiveTab] = useState<"profile" | "payouts" | "notifications">("profile");

  // Form states
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [banner, setBanner] = useState("");
  const [website, setWebsite] = useState("");
  const [socialTwitter, setSocialTwitter] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialYoutube, setSocialYoutube] = useState("");
  const [socialFacebook, setSocialFacebook] = useState("");

  // Payout info
  const [payoutPhone, setPayoutPhone] = useState("");
  const [payoutOperator, setPayoutOperator] = useState("ORANGE_MONEY");

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (creatorProfile) {
      setDisplayName(creatorProfile.displayName || "");
      setBio(creatorProfile.bio || "");
      setAvatar(creatorProfile.avatar || "");
      setBanner(creatorProfile.banner || "");
      setWebsite(creatorProfile.website || "");

      const socials = creatorProfile.socialLinks || {};
      setSocialTwitter(socials.twitter || "");
      setSocialInstagram(socials.instagram || "");
      setSocialYoutube(socials.youtube || "");
      setSocialFacebook(socials.facebook || "");
    }
  }, [creatorProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setFeedback({ type: "error", text: "Le nom d'artiste ou du créateur est obligatoire." });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      const payload = {
        displayName: displayName.trim(),
        bio: bio.trim() || undefined,
        avatar: avatar.trim() || undefined,
        banner: banner.trim() || undefined,
        website: website.trim() || undefined,
        socialLinks: {
          twitter: socialTwitter.trim() || undefined,
          instagram: socialInstagram.trim() || undefined,
          youtube: socialYoutube.trim() || undefined,
          facebook: socialFacebook.trim() || undefined,
        },
      };

      const res = await fetchApi("/me/creator-profile", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      if (res.success) {
        setFeedback({ type: "success", text: "Profil créateur mis à jour avec succès !" });
        mutate();
        setTimeout(() => setFeedback(null), 4000);
      } else {
        throw new Error(res.message || "Erreur lors de la mise à jour");
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Impossible de sauvegarder le profil." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FFBF00] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#222222] pb-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <Settings className="w-7 h-7 text-[#FFBF00]" />
            Paramètres Studio
          </h1>
          <p className="text-xs sm:text-sm text-[#888888]">
            Configurez votre profil d'artiste public, vos coordonnées de reversement et vos notifications.
          </p>
        </div>

        {creatorProfile?.slug && (
          <Link
            href={`/creators/${creatorProfile.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2A2A2A] bg-[#141414] hover:bg-[#1C1C1C] text-[#AAAAAA] hover:text-white text-xs font-medium transition-colors self-start sm:self-auto"
          >
            <span>Voir mon profil public</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#222222] pb-3 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "profile"
              ? "bg-[#FFBF00] text-black"
              : "bg-[#141414] text-[#888888] hover:text-white border border-[#262626]"
          }`}
        >
          <Mic2 className="w-3.5 h-3.5" />
          <span>Profil Public & Réseaux</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("payouts")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "payouts"
              ? "bg-[#FFBF00] text-black"
              : "bg-[#141414] text-[#888888] hover:text-white border border-[#262626]"
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Monétisation & Reversements</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("notifications")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "notifications"
              ? "bg-[#FFBF00] text-black"
              : "bg-[#141414] text-[#888888] hover:text-white border border-[#262626]"
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Notifications Studio</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-bold border flex items-center gap-2.5 transition-all ${
            feedback.type === "success"
              ? "bg-[#238636]/15 text-[#3fb950] border-[#238636]/30"
              : "bg-red-500/15 text-red-400 border-red-500/30"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* TAB 1: PROFIL PUBLIC & RÉSEAUX */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="border-b border-[#1E1E1E] pb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Mic2 className="w-4 h-4 text-[#FFBF00]" />
                Identité publique de créateur
              </h2>
              <p className="text-xs text-[#888888] mt-1">
                Ces informations sont affichées sur votre page publique et sur vos fiches d'émissions.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-[#CCCCCC] mb-1.5">
                  Nom d'artiste / Display Name *
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ex: Studio Sahel, Moussa Traoré..."
                  className="w-full bg-[#161616] border border-[#262626] rounded-xl py-2.5 px-3.5 text-xs text-white outline-none focus:border-[#FFBF00] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#CCCCCC] mb-1.5">
                  Lien personnalisé (Slug)
                </label>
                <input
                  type="text"
                  value={creatorProfile?.slug || "auto-généré"}
                  disabled
                  className="w-full bg-[#141414] border border-[#262626] rounded-xl py-2.5 px-3.5 text-xs text-[#666666] cursor-not-allowed outline-none select-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#CCCCCC] mb-1.5">
                Biographie / Présentation
              </label>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Racontez votre univers, votre démarche éditoriale et vos thèmes de prédilection..."
                className="w-full bg-[#161616] border border-[#262626] rounded-xl py-2.5 px-3.5 text-xs text-white outline-none focus:border-[#FFBF00] transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-[#CCCCCC] mb-1.5">
                  URL de la photo de profil / Avatar
                </label>
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#161616] border border-[#262626] rounded-xl py-2.5 px-3.5 text-xs text-white outline-none focus:border-[#FFBF00] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#CCCCCC] mb-1.5">
                  URL de la bannière de couverture
                </label>
                <input
                  type="url"
                  value={banner}
                  onChange={(e) => setBanner(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#161616] border border-[#262626] rounded-xl py-2.5 px-3.5 text-xs text-white outline-none focus:border-[#FFBF00] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#CCCCCC] mb-1.5">
                Site web officiel
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://mon-podcast.ml"
                className="w-full bg-[#161616] border border-[#262626] rounded-xl py-2.5 px-3.5 text-xs text-white outline-none focus:border-[#FFBF00] transition-colors"
              />
            </div>
          </div>

          {/* Réseaux sociaux */}
          <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="border-b border-[#1E1E1E] pb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#FFBF00]" />
                Réseaux sociaux & Liens externes
              </h2>
              <p className="text-xs text-[#888888] mt-1">
                Aidez vos auditeurs à vous suivre sur vos autres plateformes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-[#CCCCCC] mb-1.5">
                  X / Twitter
                </label>
                <input
                  type="text"
                  value={socialTwitter}
                  onChange={(e) => setSocialTwitter(e.target.value)}
                  placeholder="https://x.com/moncompte"
                  className="w-full bg-[#161616] border border-[#262626] rounded-xl py-2.5 px-3.5 text-xs text-white outline-none focus:border-[#FFBF00] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#CCCCCC] mb-1.5">
                  Instagram
                </label>
                <input
                  type="text"
                  value={socialInstagram}
                  onChange={(e) => setSocialInstagram(e.target.value)}
                  placeholder="https://instagram.com/moncompte"
                  className="w-full bg-[#161616] border border-[#262626] rounded-xl py-2.5 px-3.5 text-xs text-white outline-none focus:border-[#FFBF00] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#CCCCCC] mb-1.5">
                  YouTube
                </label>
                <input
                  type="text"
                  value={socialYoutube}
                  onChange={(e) => setSocialYoutube(e.target.value)}
                  placeholder="https://youtube.com/@chaine"
                  className="w-full bg-[#161616] border border-[#262626] rounded-xl py-2.5 px-3.5 text-xs text-white outline-none focus:border-[#FFBF00] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#CCCCCC] mb-1.5">
                  Facebook
                </label>
                <input
                  type="text"
                  value={socialFacebook}
                  onChange={(e) => setSocialFacebook(e.target.value)}
                  placeholder="https://facebook.com/page"
                  className="w-full bg-[#161616] border border-[#262626] rounded-xl py-2.5 px-3.5 text-xs text-white outline-none focus:border-[#FFBF00] transition-colors"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-[#FFBF00] hover:bg-[#E5A800] text-[#0B0B0B] font-bold text-xs rounded-xl transition-all shadow disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Sauvegarder les modifications</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: MONÉTISATION & REVERSEMENTS */}
      {activeTab === "payouts" && (
        <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-[#1E1E1E] pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#FFBF00]" />
              Coordonnées de reversement Mobile Money
            </h2>
            <p className="text-xs text-[#888888] mt-1">
              Vos revenus générés par les abonnements premium et les achats à l'épisode sont versés directement sur ce numéro.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-[#CCCCCC] mb-1.5">
                Opérateur de paiement
              </label>
              <select
                value={payoutOperator}
                onChange={(e) => setPayoutOperator(e.target.value)}
                className="w-full bg-[#161616] border border-[#262626] rounded-xl py-2.5 px-3.5 text-xs text-white outline-none focus:border-[#FFBF00] transition-colors"
              >
                <option value="ORANGE_MONEY">Orange Money Mali (🇲🇱 +223)</option>
                <option value="WAVE">Wave Mali / Sénégal (💙)</option>
                <option value="MOOV_MONEY">Moov Money Mali (🇲🇱 +223)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#CCCCCC] mb-1.5">
                Numéro Mobile Money de réception
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#666666] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={payoutPhone}
                  onChange={(e) => setPayoutPhone(e.target.value)}
                  placeholder="+223 70 00 00 00"
                  className="w-full bg-[#161616] border border-[#262626] rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-white outline-none focus:border-[#FFBF00] transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#161616] border border-[#262626] space-y-2 text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#FFBF00]" />
              Règle de reversement et commissions
            </span>
            <p className="text-[#888888] leading-relaxed">
              Les reversements sont traités le 5 de chaque mois civil pour tous les créateurs ayant cumulé au minimum 10 000 FCFA de ventes nettes. Les frais d'opérateurs Mobile Money sont pris en charge.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setFeedback({ type: "success", text: "Coordonnées de reversement enregistrées !" });
                setTimeout(() => setFeedback(null), 4000);
              }}
              className="px-6 py-2.5 bg-[#FFBF00] hover:bg-[#E5A800] text-[#0B0B0B] font-bold text-xs rounded-xl transition-all shadow flex items-center gap-2"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Enregistrer le compte de reversement</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: NOTIFICATIONS STUDIO */}
      {activeTab === "notifications" && (
        <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-[#1E1E1E] pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#FFBF00]" />
              Préférences d'alertes & notifications
            </h2>
            <p className="text-xs text-[#888888] mt-1">
              Gérez les alertes envoyées par e-mail ou sur votre appareil.
            </p>
          </div>

          <div className="space-y-4">
            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-[#161616] border border-[#262626] cursor-pointer">
              <input type="checkbox" defaultChecked className="mt-1 accent-[#FFBF00]" />
              <div>
                <span className="text-xs font-bold text-white block">Alertes de modération</span>
                <span className="text-[11px] text-[#888888]">Être prévenu immédiatement lorsqu'un épisode est validé ou nécessite des corrections.</span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-[#161616] border border-[#262626] cursor-pointer">
              <input type="checkbox" defaultChecked className="mt-1 accent-[#FFBF00]" />
              <div>
                <span className="text-xs font-bold text-white block">Nouveaux abonnés & écoutes</span>
                <span className="text-[11px] text-[#888888]">Recevoir un récapitulatif hebdomadaire de vos performances d'écoute et nouveaux abonnés.</span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-[#161616] border border-[#262626] cursor-pointer">
              <input type="checkbox" defaultChecked className="mt-1 accent-[#FFBF00]" />
              <div>
                <span className="text-xs font-bold text-white block">Achats & Abonnements</span>
                <span className="text-[11px] text-[#888888]">Notification lors de chaque achat d'épisode premium ou souscription de pass créateur.</span>
              </div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
