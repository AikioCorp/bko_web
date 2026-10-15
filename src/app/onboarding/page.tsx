"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Globe,
  Tag,
  Radio,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  Compass,
  AlertCircle,
  RefreshCw,
  Search,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { API_BASE_URL, fetchApi } from "@/lib/api";
import { getAccessToken } from "@/lib/token";
import { sanitizeRedirect, getDestinationForRole } from "@/lib/auth-navigation";

interface LanguageItem {
  code: string;
  name: string;
  nativeName?: string | null;
}

interface TopicItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

interface PodcastItem {
  id: string;
  title?: string;
  name?: string;
  cover?: string | null;
  coverUrl?: string | null;
  imageUrl?: string | null;
  authorName?: string | null;
  author?: { name?: string } | null;
  permanentPersons?: Array<{ person?: { name?: string } }>;
}

function sanitizeCoverUrl(raw?: string | null): string {
  if (!raw || typeof raw !== "string") return "/images/default-cover.jpg";
  let url = raw.trim();
  if (!url) return "/images/default-cover.jpg";

  // Décodage des entités HTML couramment injectées par les flux RSS
  url = url
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }

  if (url.startsWith("/")) {
    if (url.startsWith("/images/") || url.startsWith("/brand/") || url.endsWith(".png") || url.endsWith(".jpg")) {
      return url;
    }
    const baseOrigin = API_BASE_URL.replace(/\/api\/v\d+\/?$/, "");
    return `${baseOrigin}${url}`;
  }

  return "/images/default-cover.jpg";
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, updateUser, checkAuth } = useAuthStore();

  const rawRedirect = searchParams.get("redirect");
  const destination = sanitizeRedirect(rawRedirect);

  // Étape courante : 1: Langues, 2: Centres d'intérêt, 3: Émissions (facultatif)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Données référentielles
  const [languages, setLanguages] = useState<LanguageItem[]>([]);
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [podcasts, setPodcasts] = useState<PodcastItem[]>([]);
  const [isLoadingRef, setIsLoadingRef] = useState(true);
  const [refError, setRefError] = useState<string | null>(null);

  // Sélections utilisateur
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedPodcasts, setSelectedPodcasts] = useState<string[]>([]);

  // Recherche locale de thèmes
  const [topicSearch, setTopicSearch] = useState("");

  // Statuts de soumission
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // 1. Charger les référentiels réels
  useEffect(() => {
    let isCancelled = false;

    async function loadReferentials() {
      setIsLoadingRef(true);
      setRefError(null);

      try {
        const [langRes, topRes, podRes] = await Promise.all([
          fetchApi("/languages?hasContent=true").catch(() => fetchApi("/languages")),
          fetchApi("/topics?hasContent=true").catch(() => fetchApi("/topics")),
          fetchApi("/podcasts?limit=24&hasContent=true").catch(() => fetchApi("/podcasts?limit=24")),
        ]);

        if (isCancelled) return;

        const langData = Array.isArray(langRes?.data)
          ? langRes.data
          : Array.isArray(langRes)
          ? langRes
          : [];
        const topData = Array.isArray(topRes?.data)
          ? topRes.data
          : Array.isArray(topRes)
          ? topRes
          : [];
        const podData = Array.isArray(podRes?.data?.items)
          ? podRes.data.items
          : Array.isArray(podRes?.data)
          ? podRes.data
          : Array.isArray(podRes)
          ? podRes
          : [];

        setLanguages(langData);
        setTopics(topData);
        setPodcasts(podData);
      } catch (err: any) {
        if (!isCancelled) {
          setRefError("Impossible de charger les langues et les thèmes depuis le serveur.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingRef(false);
        }
      }
    }

    loadReferentials();

    return () => {
      isCancelled = true;
    };
  }, []);

  // 2. Pré-remplir avec les préférences existantes de l'utilisateur
  useEffect(() => {
    if (user) {
      if (user.languagePreferences && user.languagePreferences.length > 0) {
        const existingLangs = user.languagePreferences
          .map((lp: any) => lp.languageCode || lp.language?.code)
          .filter(Boolean);
        setSelectedLanguages((prev) => (prev.length === 0 ? existingLangs : prev));
      }
      if (user.topicPreferences && user.topicPreferences.length > 0) {
        const existingTopics = user.topicPreferences
          .map((tp: any) => tp.topicId || tp.topic?.id)
          .filter(Boolean);
        setSelectedTopics((prev) => (prev.length === 0 ? existingTopics : prev));
      }
    }
  }, [user]);

  // Filtrage des thèmes par recherche
  const filteredTopics = useMemo(() => {
    if (!topicSearch.trim()) return topics;
    const q = topicSearch.trim().toLowerCase();
    return topics.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        t.slug?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
    );
  }, [topics, topicSearch]);

  const toggleLanguage = (code: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const toggleTopic = (id: string) => {
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const togglePodcast = (id: string) => {
    setSelectedPodcasts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  // Enregistrement fiable des préférences
  const handleSavePreferences = async (isSkipping: boolean = false) => {
    setIsSaving(true);
    setSaveError(null);

    const token = getAccessToken();
    if (!token) {
      // Si pas connecté, rediriger vers login
      router.push(`/login?redirect=${encodeURIComponent(destination || "/")}`);
      return;
    }

    try {
      const payload: {
        languageCodes?: string[];
        topicIds?: string[];
        podcastIds?: string[];
      } = {};

      if (isSkipping) {
        // En cas de saut ("Plus tard"), on conserve les préférences existantes sans écraser
        // et on marque l'état comme ignoré / plus tard
        await fetch(`${API_BASE_URL}/recommendations/onboarding/state`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ state: "DISMISSED" }),
        });
      } else {
        // Envoi des sélections explicites
        payload.languageCodes = selectedLanguages;
        payload.topicIds = selectedTopics;
        payload.podcastIds = selectedPodcasts;

        const res = await fetch(`${API_BASE_URL}/recommendations/onboarding`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error?.message || data.message || "Échec de l'enregistrement de vos préférences.");
        }
      }

      // Recharger le profil canonique /me pour synchroniser l'état global
      await checkAuth();

      // Navigation vers la destination demandée ou l'espace standard
      const finalTarget = destination || getDestinationForRole(user?.roles || []);
      router.push(finalTarget);
    } catch (err: any) {
      setSaveError(err.message || "Une erreur est survenue lors de l'enregistrement. Veuillez réessayer.");
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white flex flex-col items-center justify-center px-4 py-12 select-none">
      <div className="w-full max-w-2xl bg-[#141414] border border-[#262626] rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden space-y-8">
        
        {/* Barre de progression par étapes (3 étapes nettes, zéro gradient) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-[#8E8E93]">
            <span className="uppercase tracking-wider">
              Étape {step} sur 3 &bull;{" "}
              {step === 1
                ? "Langues d'écoute"
                : step === 2
                ? "Centres d'intérêt"
                : "Émissions à découvrir"}
            </span>
            <button
              onClick={() => handleSavePreferences(true)}
              className="text-[#A1A1AA] hover:text-[#FFBF00] transition-colors font-medium py-1 px-2"
            >
              Passer pour le moment
            </button>
          </div>

          <div className="w-full h-1.5 bg-[#242424] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#FFBF00] transition-all duration-300 ease-out"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Bannière d'erreur de sauvegarde */}
        {saveError && (
          <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{saveError}</span>
            </div>
            <button
              onClick={() => handleSavePreferences(false)}
              className="px-3 py-1 bg-red-900/60 hover:bg-red-800 text-white rounded-lg font-bold text-xs shrink-0"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Étape 1 : Langues d'écoute */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#1F1B10] border border-[#FFBF00]/30 text-[#FFBF00] flex items-center justify-center">
                <Globe className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Dans quelles langues écoutez-vous ?
              </h1>
              <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                Choisissez une ou plusieurs langues pour que nous vous proposions des émissions adaptées à vos habitudes. Vos choix d'écoute ne modifieront pas la langue de votre interface.
              </p>
            </div>

            {isLoadingRef ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-[#71717A] text-xs">
                <RefreshCw className="w-5 h-5 animate-spin text-[#FFBF00]" />
                <span>Chargement des langues disponibles...</span>
              </div>
            ) : refError ? (
              <div className="p-4 rounded-xl bg-[#1C1814] border border-[#3A3225] text-amber-200 text-xs">
                {refError}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[46vh] overflow-y-auto pr-1">
                {languages.map((lang) => {
                  const isSelected = selectedLanguages.includes(lang.code);
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => toggleLanguage(lang.code)}
                      className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-[#1E1B12] border-[#FFBF00] text-white"
                          : "bg-[#0E0E0E] border-[#242424] text-[#D4D4D8] hover:border-[#383838] hover:text-white"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-sm text-white flex items-center gap-2">
                          <span>{lang.name}</span>
                          {lang.nativeName && (
                            <span className="text-xs text-[#8E8E93] font-normal">
                              ({lang.nativeName})
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#71717A] uppercase font-mono">
                          {lang.code}
                        </span>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center border shrink-0 transition-colors ${
                          isSelected
                            ? "bg-[#FFBF00] border-[#FFBF00] text-black"
                            : "border-[#3A3A3C] text-transparent"
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="pt-4 flex items-center justify-between gap-3 border-t border-[#242424]">
              <div className="text-xs text-[#71717A]">
                {selectedLanguages.length === 0
                  ? "Sélectionnez au moins une langue"
                  : `${selectedLanguages.length} langue${selectedLanguages.length > 1 ? "s" : ""} sélectionnée${selectedLanguages.length > 1 ? "s" : ""}`}
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={selectedLanguages.length === 0}
                className="py-3 px-6 rounded-xl bg-[#FFBF00] hover:bg-[#E5AB00] text-black font-extrabold text-xs transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Continuer</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Étape 2 : Centres d'intérêt (Véritables sujets / Topics) */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#1F1B10] border border-[#FFBF00]/30 text-[#FFBF00] flex items-center justify-center">
                <Tag className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Quels sujets vous passionnent ?
              </h1>
              <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                Sélectionnez vos centres d'intérêt afin que nous puissions affiner vos découvertes et vos recommandations.
              </p>
            </div>

            {/* Barre de recherche de sujets */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Rechercher un sujet (ex: Histoire, Économie, Musique...)"
                value={topicSearch}
                onChange={(e) => setTopicSearch(e.target.value)}
                className="w-full bg-[#0E0E0E] border border-[#242424] focus:border-[#FFBF00] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#52525B] outline-none transition-colors"
              />
            </div>

            {isLoadingRef ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-[#71717A] text-xs">
                <RefreshCw className="w-5 h-5 animate-spin text-[#FFBF00]" />
                <span>Chargement des thématiques...</span>
              </div>
            ) : filteredTopics.length === 0 ? (
              <div className="py-8 text-center text-[#71717A] text-xs bg-[#0E0E0E] rounded-2xl border border-[#242424] p-6">
                Aucun sujet ne correspond à votre recherche.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2.5 max-h-[42vh] overflow-y-auto pr-1">
                {filteredTopics.map((topic) => {
                  const isSelected = selectedTopics.includes(topic.id);
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => toggleTopic(topic.id)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${
                        isSelected
                          ? "bg-[#FFBF00] border-[#FFBF00] text-black"
                          : "bg-[#0E0E0E] border-[#242424] text-[#D4D4D8] hover:border-[#3A3A3C] hover:text-white"
                      }`}
                    >
                      <span>{topic.name}</span>
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        <Plus className="w-3.5 h-3.5 text-[#71717A]" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="pt-4 flex items-center justify-between gap-3 border-t border-[#242424]">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3 px-4 rounded-xl bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white font-bold text-xs transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="py-3 px-6 rounded-xl bg-[#FFBF00] hover:bg-[#E5AB00] text-black font-extrabold text-xs transition-colors flex items-center gap-2"
              >
                <span>Continuer</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Étape 3 : Émissions à découvrir & suivre (Facultatif) */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#1F1B10] border border-[#FFBF00]/30 text-[#FFBF00] flex items-center justify-center">
                <Radio className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Découvrez des émissions populaires
              </h1>
              <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                Suivez dès maintenant vos premiers podcasts pour retrouver automatiquement leurs nouveaux épisodes dans votre bibliothèque.
              </p>
            </div>

            {isLoadingRef ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-[#71717A] text-xs">
                <RefreshCw className="w-5 h-5 animate-spin text-[#FFBF00]" />
                <span>Chargement des émissions...</span>
              </div>
            ) : podcasts.length === 0 ? (
              <div className="py-8 text-center text-[#71717A] text-xs bg-[#0E0E0E] rounded-2xl border border-[#242424] p-6">
                Aucune émission disponible pour le moment. Vous pourrez en découvrir sur la page d'accueil !
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[44vh] overflow-y-auto pr-1">
                {podcasts.map((podcast) => {
                  const isFollowed = selectedPodcasts.includes(podcast.id);
                  const title = podcast.name || podcast.title || "Émission";
                  const author =
                    podcast.authorName ||
                    podcast.author?.name ||
                    podcast.permanentPersons?.[0]?.person?.name ||
                    "Bamako Podcast";
                  const cover = sanitizeCoverUrl(
                    podcast.cover || podcast.coverUrl || podcast.imageUrl
                  );

                  return (
                    <div
                      key={podcast.id}
                      className="p-3 bg-[#0E0E0E] border border-[#242424] rounded-2xl flex items-center justify-between gap-3 hover:border-[#383838] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-[#1C1C1E] overflow-hidden shrink-0 relative flex items-center justify-center border border-[#262626]">
                          {cover ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={cover}
                              alt={title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = "/images/default-cover.jpg";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center text-[#FFBF00]">
                              <Radio className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-xs font-bold text-white truncate">{title}</h2>
                          <p className="text-[11px] text-[#8E8E93] truncate">{author}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => togglePodcast(podcast.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                          isFollowed
                            ? "bg-[#27272A] text-white border border-[#3F3F46]"
                            : "bg-[#FFBF00] text-black hover:bg-[#E5AB00]"
                        }`}
                      >
                        {isFollowed ? "Suivi" : "Suivre"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-4 flex items-center justify-between gap-3 border-t border-[#242424]">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-3 px-4 rounded-xl bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white font-bold text-xs transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour</span>
              </button>

              <button
                type="button"
                onClick={() => handleSavePreferences(false)}
                disabled={isSaving}
                className="py-3 px-6 rounded-xl bg-[#FFBF00] hover:bg-[#E5AB00] text-black font-extrabold text-xs transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <span>Terminer & commencer à écouter</span>
                    <Compass className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center text-white text-xs">
          Chargement de l'espace de personnalisation...
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
