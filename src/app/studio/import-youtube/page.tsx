"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  Youtube,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Clock,
  Layers,
  ArrowRight,
  Plus,
  Sliders,
  ChevronLeft,
  Info,
  Radio,
  Image as ImageIcon,
} from "lucide-react";
import { fetchApi, API_BASE_URL } from "@/lib/api";
import { getAccessToken } from "@/lib/token";
import { Button } from "@/components/ui/button";

export default function StudioImportYoutube() {
  const router = useRouter();

  // Wizard state: 1: Saisie URL, 2: Analyse & Prévisualisation, 3: Destination & Réglages, 4: Confirmation
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Étape 1 : URL
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);

  // Étape 2 : Choix destination ("new" vs "existing")
  const [targetMode, setTargetMode] = useState<"new" | "existing">("new");
  const [existingPodcastId, setExistingPodcastId] = useState("");

  // Métadonnées émission (préremplies)
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cover, setCover] = useState("");
  const [countryId, setCountryId] = useState("ML");
  const [primaryLanguageCode, setPrimaryLanguageCode] = useState("fr");
  const [createdPodcastId, setCreatedPodcastId] = useState<string | null>(null);

  // Étape 3 : Réglages d'importation
  const [discoveryMode, setDiscoveryMode] = useState<"STANDARD" | "ALL" | "SHORTS">("STANDARD");
  const [autoSync, setAutoSync] = useState(true);
  const [autoPublish, setAutoPublish] = useState(false);
  const [excludeShorts, setExcludeShorts] = useState(true);
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(new Set());
  const [includeKeywords, setIncludeKeywords] = useState("");
  const [excludeKeywords, setExcludeKeywords] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Données référentielles
  const { data: podcastsData } = useSWR("/creator/podcasts", (u) =>
    fetchApi(u).then((res: any) => {
      const d = res.data;
      return Array.isArray(d) ? d : d?.items || [];
    })
  );
  const { data: countriesData } = useSWR("/countries", (u) =>
    fetchApi(u).then((res: any) => res.data || [])
  );

  const existingPodcasts = podcastsData || [];
  const countries = countriesData || [];

  // Mettre à jour l'émission existante sélectionnée par défaut si disponible
  useEffect(() => {
    if (existingPodcasts.length > 0 && !existingPodcastId) {
      setExistingPodcastId(existingPodcasts[0].id);
    }
  }, [existingPodcasts, existingPodcastId]);

  // Analyse de la source
  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) {
      setError("Veuillez renseigner une adresse ou identifiant de chaîne YouTube.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setPreviewData(null);
    setSelectedVideoIds(new Set());

    try {
      const res = await fetchApi("/creator/youtube/preview", {
        method: "POST",
        body: JSON.stringify({
          url: url.trim(),
          mode: discoveryMode,
        }),
      });

      if (!res.success) {
        throw new Error(res.message || "Impossible d'analyser cette chaîne YouTube.");
      }

      const data = res.data;
      setPreviewData(data);

      // Préremplissage automatique des métadonnées
      const channel = data.channel || {};
      setName(channel.title || channel.channelTitle || "");
      setDescription(channel.description || channel.channelDescription || "");
      setCover(channel.thumbnailUrl || "");

      // Sélection par défaut des vidéos éligibles
      const vids = new Set<string>();
      (data.videos || data.items || []).forEach((v: any) => {
        const id = v.youtubeVideoId || v.videoId;
        if (id && !v.isAlreadyImported && v.embeddable !== false) {
          if (!excludeShorts || !v.isLikelyShort) {
            vids.add(id);
          }
        }
      });
      setSelectedVideoIds(vids);
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'analyse de la chaîne.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleSelectAll = () => {
    const all = new Set<string>();
    const videos = previewData?.videos || previewData?.items || [];
    if (selectedVideoIds.size === videos.length) {
      setSelectedVideoIds(new Set());
    } else {
      videos.forEach((v: any) => {
        const id = v.youtubeVideoId || v.videoId;
        if (id) all.add(id);
      });
      setSelectedVideoIds(all);
    }
  };

  const toggleVideo = (id: string) => {
    const next = new Set(selectedVideoIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedVideoIds(next);
  };

  // Confirmation et connexion de la chaîne
  const handleConfirm = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      let podcastIdToUse = targetMode === "existing" ? existingPodcastId : createdPodcastId;

      // Étape 1 : Créer l'émission si mode "new" et pas encore créée
      if (targetMode === "new" && !podcastIdToUse) {
        if (!name.trim()) throw new Error("Le nom de l'émission est obligatoire.");
        if (!countryId) throw new Error("Veuillez sélectionner le pays de l'émission.");

        const createRes = await fetchApi("/creator/podcasts", {
          method: "POST",
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            cover: cover.trim(),
            countryId,
            primaryLanguageCode,
            status: "DRAFT",
          }),
        });

        if (!createRes.success || !createRes.data?.id) {
          throw new Error(createRes.message || "Échec de la création de l'émission.");
        }

        podcastIdToUse = createRes.data.id;
        setCreatedPodcastId(podcastIdToUse);
      }

      if (!podcastIdToUse) {
        throw new Error("Veuillez sélectionner une émission de destination.");
      }

      // Étape 2 : Connecter la chaîne YouTube à l'émission
      const channel = previewData.channel || {};
      const connectRes = await fetchApi(`/creator/podcasts/${podcastIdToUse}/youtube/connect`, {
        method: "POST",
        body: JSON.stringify({
          channelId: channel.channelId,
          channelTitle: channel.title || channel.channelTitle || name,
          channelDescription: channel.description || channel.channelDescription || description,
          thumbnailUrl: channel.thumbnailUrl || cover,
          feedUrl: channel.feedUrl,
          customUrl: channel.customUrl,
          selectedVideoIds: Array.from(selectedVideoIds),
          settings: {
            autoSyncFuture: autoSync,
            autoPublish,
            excludeShorts,
            keepManualEdits: true,
            includeKeywords: includeKeywords.split(",").map((s) => s.trim()).filter(Boolean),
            excludeKeywords: excludeKeywords.split(",").map((s) => s.trim()).filter(Boolean),
          },
        }),
      });

      if (!connectRes.success) {
        throw new Error(connectRes.message || "Échec de la connexion de la chaîne YouTube.");
      }

      // Succès : redirection vers le tableau de suivi de la connexion
      router.push(`/studio/podcasts/${podcastIdToUse}/youtube`);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de la configuration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const videos = previewData?.videos || previewData?.items || [];

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto pb-16">
      {/* En-tête avec navigation d'étapes */}
      <div className="border-b border-[#222222] pb-5">
        <div className="flex items-center gap-2 text-xs font-bold text-[#888888] mb-1">
          <Link href="/studio/podcasts" className="hover:text-white transition-colors">
            Studio
          </Link>
          <span>/</span>
          <span className="text-[#FFBF00]">Connexion YouTube</span>
        </div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Youtube className="w-6 h-6 text-[#FF0000]" />
          Harmonisation YouTube Studio
        </h1>
        <p className="text-sm text-[#888888] mt-1">
          Analysez votre chaîne YouTube, visualisez ses vidéos et choisissez de créer une nouvelle émission ou d'enrichir une émission existante.
        </p>

        {/* Indicateur d'étapes */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[#1C1C1C]">
          <div
            className={`flex items-center gap-2 text-xs font-bold ${
              step >= 1 ? "text-[#FFBF00]" : "text-[#555]"
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                step >= 1 ? "bg-[#FFBF00] text-[#000]" : "bg-[#222] text-[#888]"
              }`}
            >
              1
            </span>
            <span>Source YouTube</span>
          </div>
          <div
            className={`flex items-center gap-2 text-xs font-bold ${
              step >= 2 ? "text-[#FFBF00]" : "text-[#555]"
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                step >= 2 ? "bg-[#FFBF00] text-[#000]" : "bg-[#222] text-[#888]"
              }`}
            >
              2
            </span>
            <span>Prévisualisation & Destination</span>
          </div>
          <div
            className={`flex items-center gap-2 text-xs font-bold ${
              step >= 3 ? "text-[#FFBF00]" : "text-[#555]"
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                step >= 3 ? "bg-[#FFBF00] text-[#000]" : "bg-[#222] text-[#888]"
              }`}
            >
              3
            </span>
            <span>Réglages & Confirmation</span>
          </div>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="font-bold text-red-400 hover:underline">
            Fermer
          </button>
        </div>
      )}

      {/* Étape 1 : Saisie de l'URL et analyse */}
      {step === 1 && (
        <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#AAAAAA]">
              Adresse ou identifiant de la chaîne YouTube
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="https://www.youtube.com/@MaChaine ou identifiant UC..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                className="flex-1 bg-[#181818] border border-[#333333] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FFBF00] transition-colors"
              />
              <Button
                onClick={() => handleAnalyze()}
                disabled={isAnalyzing || !url.trim()}
                className="bg-[#FFBF00] hover:bg-[#E5A800] text-[#0B0B0B] font-bold px-6 shrink-0"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyse…
                  </>
                ) : (
                  <>
                    Analyser la source
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-[#777777]">
              L'analyse s'effectue directement sur YouTube sans modifier votre catalogue ni créer d'émission prématurément.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#181818] border border-[#262626] text-xs text-[#AAAAAA] space-y-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <Info className="w-4 h-4 text-[#FFBF00]" />
              Règle de respect des droits et format
            </div>
            <p>
              La synchronisation YouTube conserve la lecture vidéo native via le lecteur YouTube officiel, sans conversion MP3 non autorisée. Vous pourrez affiner les filtres de mots-clés et exclure les Shorts.
            </p>
          </div>
        </div>
      )}

      {/* Étape 2 : Prévisualisation des contenus et choix de destination */}
      {step >= 2 && previewData && (
        <div className="space-y-6">
          {/* Carte Résumé de la chaîne détectée */}
          <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#222222] pb-5">
              <div className="flex items-center gap-4">
                {previewData.channel?.thumbnailUrl ? (
                  <img
                    src={previewData.channel.thumbnailUrl}
                    alt={previewData.channel.title}
                    className="w-16 h-16 rounded-full object-cover border border-[#333]"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#222] flex items-center justify-center">
                    <Youtube className="w-8 h-8 text-red-500" />
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    {previewData.channel?.title || previewData.channel?.channelTitle}
                    <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-black">
                      YOUTUBE
                    </span>
                  </h2>
                  <p className="text-xs text-[#888] line-clamp-1 max-w-xl">
                    {previewData.channel?.description || previewData.channel?.channelDescription || "Aucune description fournie"}
                  </p>
                  <p className="text-xs text-[#FFBF00] font-semibold mt-1">
                    {videos.length} vidéos détectées prêtes à l'analyse
                  </p>
                </div>
              </div>
              {step === 2 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="bg-[#181818] border-[#333] text-white hover:bg-[#222] text-xs"
                >
                  Modifier le lien
                </Button>
              )}
            </div>

            {/* Choix de la destination */}
            {step === 2 && (
              <div className="mt-6 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Comment souhaitez-vous intégrer cette source ?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Option 1 : Créer une nouvelle émission */}
                  <div
                    onClick={() => setTargetMode("new")}
                    className={`p-5 rounded-xl border cursor-pointer transition-all ${
                      targetMode === "new"
                        ? "bg-[#181818] border-[#FFBF00] shadow-md"
                        : "bg-[#141414] border-[#262626] hover:border-[#444]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          targetMode === "new" ? "border-[#FFBF00]" : "border-[#555]"
                        }`}
                      >
                        {targetMode === "new" && <div className="w-2.5 h-2.5 bg-[#FFBF00] rounded-full" />}
                      </div>
                      <span className="text-sm font-bold text-white">Créer une nouvelle émission</span>
                    </div>
                    <p className="text-xs text-[#888] mt-2 pl-8">
                      Préremplit le titre, la description et la couverture à partir de la chaîne YouTube.
                    </p>
                  </div>

                  {/* Option 2 : Associer à une émission existante */}
                  <div
                    onClick={() => {
                      if (existingPodcasts.length > 0) setTargetMode("existing");
                    }}
                    className={`p-5 rounded-xl border transition-all ${
                      existingPodcasts.length === 0
                        ? "opacity-50 cursor-not-allowed bg-[#141414] border-[#222]"
                        : targetMode === "existing"
                        ? "bg-[#181818] border-[#FFBF00] shadow-md cursor-pointer"
                        : "bg-[#141414] border-[#262626] hover:border-[#444] cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          targetMode === "existing" ? "border-[#FFBF00]" : "border-[#555]"
                        }`}
                      >
                        {targetMode === "existing" && <div className="w-2.5 h-2.5 bg-[#FFBF00] rounded-full" />}
                      </div>
                      <span className="text-sm font-bold text-white">Associer à une émission existante</span>
                    </div>
                    <p className="text-xs text-[#888] mt-2 pl-8">
                      {existingPodcasts.length > 0
                        ? "Ajoute les vidéos YouTube aux épisodes d'une émission de votre Studio."
                        : "Aucune émission existante dans votre Studio. Choisissez la création d'émission."}
                    </p>
                  </div>
                </div>

                {/* Formulaire selon l'option choisie */}
                {targetMode === "new" ? (
                  <div className="mt-4 p-5 rounded-xl bg-[#141414] border border-[#222222] space-y-4">
                    <h4 className="text-xs font-bold text-[#AAAAAA] uppercase tracking-wider">
                      Métadonnées de l'émission à créer
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-[#888] block mb-1">Nom de l'émission</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-[#181818] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FFBF00]"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[#888] block mb-1">Pays de rattachement</label>
                        <select
                          value={countryId}
                          onChange={(e) => setCountryId(e.target.value)}
                          className="w-full bg-[#181818] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FFBF00]"
                        >
                          {countries.map((c: any) => (
                            <option key={c.id || c.code} value={c.id || c.code}>
                              {c.name} ({c.code})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-[#888] block mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-[#181818] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FFBF00]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-5 rounded-xl bg-[#141414] border border-[#222222] space-y-3">
                    <h4 className="text-xs font-bold text-[#AAAAAA] uppercase tracking-wider">
                      Sélectionnez l'émission de destination
                    </h4>
                    <select
                      value={existingPodcastId}
                      onChange={(e) => setExistingPodcastId(e.target.value)}
                      className="w-full bg-[#181818] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFBF00]"
                    >
                      {existingPodcasts.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => setStep(3)}
                    disabled={targetMode === "new" ? !name.trim() : !existingPodcastId}
                    className="bg-[#FFBF00] hover:bg-[#E5A800] text-[#0B0B0B] font-bold px-6"
                  >
                    Configurer les contenus & réglages
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Étape 3 : Réglages détaillés et sélection des vidéos */}
          {step === 3 && (
            <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-[#222222] pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#FFBF00]" />
                    Réglages de synchronisation
                  </h3>
                  <p className="text-xs text-[#888]">
                    Définissez la manière dont les épisodes seront synchronisés avec YouTube.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="bg-[#181818] border-[#333] text-white hover:bg-[#222] text-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  Retour
                </Button>
              </div>

              {/* Toggles de réglages */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-start gap-3 p-4 rounded-xl bg-[#161616] border border-[#262626] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={(e) => setAutoSync(e.target.checked)}
                    className="mt-1 rounded accent-[#FFBF00]"
                  />
                  <div>
                    <span className="text-sm font-bold text-white block">Synchronisation continue</span>
                    <span className="text-xs text-[#888]">
                      Reçoit automatiquement les nouvelles vidéos publiées sur la chaîne YouTube.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 rounded-xl bg-[#161616] border border-[#262626] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={excludeShorts}
                    onChange={(e) => {
                      setExcludeShorts(e.target.checked);
                      if (e.target.checked) {
                        const filtered = new Set<string>();
                        videos.forEach((v: any) => {
                          const id = v.youtubeVideoId || v.videoId;
                          if (id && !v.isLikelyShort && selectedVideoIds.has(id)) {
                            filtered.add(id);
                          }
                        });
                        setSelectedVideoIds(filtered);
                      }
                    }}
                    className="mt-1 rounded accent-[#FFBF00]"
                  />
                  <div>
                    <span className="text-sm font-bold text-white block">Exclure les Shorts</span>
                    <span className="text-xs text-[#888]">
                      Ignore les formats courts YouTube pour privilégier les épisodes au format long.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 rounded-xl bg-[#161616] border border-[#262626] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoPublish}
                    onChange={(e) => setAutoPublish(e.target.checked)}
                    className="mt-1 rounded accent-[#FFBF00]"
                  />
                  <div>
                    <span className="text-sm font-bold text-white block">Publication automatique</span>
                    <span className="text-xs text-[#888]">
                      Met immédiatement en ligne les épisodes synchronisés sans passer par l'état brouillon.
                    </span>
                  </div>
                </label>
              </div>

              {/* Sélection des vidéos initiales */}
              <div className="space-y-3 pt-4 border-t border-[#222222]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Vidéos à importer</span>
                    <span className="text-xs bg-[#222] text-[#AAA] px-2 py-0.5 rounded font-bold">
                      {selectedVideoIds.size} / {videos.length} sélectionnée(s)
                    </span>
                  </div>
                  <button
                    onClick={toggleSelectAll}
                    className="text-xs font-bold text-[#FFBF00] hover:underline"
                  >
                    {selectedVideoIds.size === videos.length ? "Tout désélectionner" : "Tout sélectionner"}
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                  {videos.length === 0 ? (
                    <p className="text-xs text-[#888] py-4 text-center">Aucune vidéo récente détectée.</p>
                  ) : (
                    videos.map((v: any) => {
                      const id = v.youtubeVideoId || v.videoId;
                      const isSelected = selectedVideoIds.has(id);

                      return (
                        <div
                          key={id}
                          onClick={() => toggleVideo(id)}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-[#181818] border-[#FFBF00]/60"
                              : "bg-[#131313] border-[#222] opacity-75 hover:opacity-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded accent-[#FFBF00]"
                          />
                          {v.thumbnailUrl ? (
                            <img
                              src={v.thumbnailUrl}
                              alt={v.title}
                              className="w-16 h-10 object-cover rounded bg-[#222] shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-10 bg-[#222] rounded flex items-center justify-center shrink-0">
                              <ImageIcon className="w-4 h-4 text-[#555]" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">{v.title}</p>
                            <div className="flex items-center gap-2 text-[11px] text-[#888] mt-0.5">
                              {v.durationLabel && <span>{v.durationLabel}</span>}
                              {v.isLikelyShort && (
                                <span className="bg-red-500/20 text-red-400 px-1.5 py-0.2 rounded font-black text-[9px]">
                                  SHORT
                                </span>
                              )}
                              {v.isAlreadyImported && (
                                <span className="text-green-500 font-bold text-[10px]">Déjà importée</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Bouton de confirmation final */}
              <div className="pt-4 border-t border-[#222222] flex items-center justify-between">
                <span className="text-xs text-[#888]">
                  Destination :{" "}
                  <strong className="text-white">
                    {targetMode === "new" ? name : existingPodcasts.find((p: any) => p.id === existingPodcastId)?.name}
                  </strong>
                </span>
                <Button
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  className="bg-[#FFBF00] hover:bg-[#E5A800] text-[#0B0B0B] font-bold px-8"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connexion en cours…
                    </>
                  ) : (
                    "Confirmer et démarrer l'import"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
