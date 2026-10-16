"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  Rss,
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
import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function StudioImportRss() {
  const router = useRouter();

  // État du wizard : 1: Saisie URL, 2: Analyse & Prévisualisation, 3: Destination & Réglages
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
  const [autoSync, setAutoSync] = useState(true);
  const [keepManualEdits, setKeepManualEdits] = useState(true);
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

  useEffect(() => {
    if (existingPodcasts.length > 0 && !existingPodcastId) {
      setExistingPodcastId(existingPodcasts[0].id);
    }
  }, [existingPodcasts, existingPodcastId]);

  // Analyse du flux RSS
  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) {
      setError("Veuillez renseigner l'adresse URL du flux RSS.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setPreviewData(null);

    try {
      const res = await fetchApi("/creator/rss/preview", {
        method: "POST",
        body: JSON.stringify({
          feedUrl: url.trim(),
        }),
      });

      if (!res.success) {
        throw new Error(res.message || "Impossible d'analyser ce flux RSS.");
      }

      const data = res.data;
      setPreviewData(data);

      // Préremplissage automatique des métadonnées
      setName(data.title || "");
      setDescription(data.description || "");
      setCover(data.image || "");
      if (data.language) {
        setPrimaryLanguageCode(data.language.substring(0, 2).toLowerCase());
      }

      setStep(2);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'analyse du flux RSS.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Confirmation et connexion du flux RSS
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

      // Étape 2 : Connecter le flux RSS à l'émission
      const connectRes = await fetchApi(`/creator/podcasts/${podcastIdToUse}/rss/connect`, {
        method: "POST",
        body: JSON.stringify({
          feedUrl: previewData.feedUrl || url.trim(),
          autoSync,
          importSettings: {
            keepManualEdits,
          },
          sourceAuthor: previewData.author,
        }),
      });

      if (!connectRes.success) {
        throw new Error(connectRes.message || "Échec de la connexion du flux RSS.");
      }

      // Succès : redirection vers le tableau de suivi du flux RSS
      router.push(`/studio/podcasts/${podcastIdToUse}/rss`);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de la configuration du flux.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sampleEpisodes = previewData?.sampleEpisodes || previewData?.items || [];

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto pb-16">
      {/* En-tête avec navigation d'étapes */}
      <div className="border-b border-[#222222] pb-5">
        <div className="flex items-center gap-2 text-xs font-bold text-[#888888] mb-1">
          <Link href="/studio/podcasts" className="hover:text-white transition-colors">
            Studio
          </Link>
          <span>/</span>
          <span className="text-[#FFBF00]">Connexion Flux RSS</span>
        </div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Rss className="w-6 h-6 text-[#FFBF00]" />
          Harmonisation Flux RSS Studio
        </h1>
        <p className="text-sm text-[#888888] mt-1">
          Analysez un flux RSS externe, visualisez ses épisodes et créez une nouvelle émission ou associez-le à une émission existante.
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
            <span>Source RSS</span>
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
              Adresse URL du flux RSS du podcast
            </label>
            <div className="flex gap-3">
              <input
                type="url"
                placeholder="https://domaine.com/feed.xml"
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
              L'analyse sécurisée vérifie la structure XML du flux sans altérer votre catalogue ni créer d'émission prématurément.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#181818] border border-[#262626] text-xs text-[#AAAAAA] space-y-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <Info className="w-4 h-4 text-[#FFBF00]" />
              Protection contre les doublons et reprise
            </div>
            <p>
              Toutes les saisies sont conservées en cas d'erreur réseau. Si l'émission est créée mais que la connexion échoue, vous pourrez reprendre sur cette même émission sans créer de doublon.
            </p>
          </div>
        </div>
      )}

      {/* Étape 2 : Prévisualisation des contenus et choix de destination */}
      {step >= 2 && previewData && (
        <div className="space-y-6">
          {/* Carte Résumé du flux détecté */}
          <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#222222] pb-5">
              <div className="flex items-center gap-4">
                {previewData.image ? (
                  <img
                    src={previewData.image}
                    alt={previewData.title}
                    className="w-16 h-16 rounded-xl object-cover border border-[#333]"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-[#222] flex items-center justify-center">
                    <Rss className="w-8 h-8 text-[#FFBF00]" />
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    {previewData.title}
                    <span className="text-[10px] bg-[#FFBF00]/20 text-[#FFBF00] px-2 py-0.5 rounded font-black">
                      FLUX RSS
                    </span>
                  </h2>
                  <p className="text-xs text-[#888] line-clamp-1 max-w-xl">
                    {previewData.description || "Aucune description fournie dans le flux"}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-[#FFBF00] font-semibold mt-1">
                    <span>{previewData.episodeCount || previewData.itemCount || 0} épisodes détectés</span>
                    {previewData.author && <span className="text-[#888]">Par {previewData.author}</span>}
                  </div>
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
                      Préremplit le titre, la description et la couverture à partir du flux RSS.
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
                        ? "Connecte ce flux RSS à une émission de votre Studio pour y synchroniser les épisodes."
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
                    Configurer les réglages du flux
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Étape 3 : Réglages détaillés et confirmation */}
          {step === 3 && (
            <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-[#222222] pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#FFBF00]" />
                    Réglages de synchronisation du flux
                  </h3>
                  <p className="text-xs text-[#888]">
                    Définissez la fréquence et le comportement de synchronisation du flux RSS.
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
                    <span className="text-sm font-bold text-white block">Synchronisation automatique périodique</span>
                    <span className="text-xs text-[#888]">
                      Vérifie le flux RSS régulièrement et importe automatiquement les nouveaux épisodes.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 rounded-xl bg-[#161616] border border-[#262626] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={keepManualEdits}
                    onChange={(e) => setKeepManualEdits(e.target.checked)}
                    className="mt-1 rounded accent-[#FFBF00]"
                  />
                  <div>
                    <span className="text-sm font-bold text-white block">Préserver les modifications manuelles</span>
                    <span className="text-xs text-[#888]">
                      Ne réécrit pas vos titres ou descriptions d'épisodes modifiés manuellement sur le Studio.
                    </span>
                  </div>
                </label>
              </div>

              {/* Aperçu des premiers épisodes */}
              <div className="space-y-3 pt-4 border-t border-[#222222]">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">Aperçu des épisodes du flux ({sampleEpisodes.length})</span>
                  <span className="text-xs text-[#888]">
                    Tous les épisodes audio du flux seront importés lors du premier traitement.
                  </span>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {sampleEpisodes.map((ep: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[#141414] border border-[#222]"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#222] flex items-center justify-center shrink-0 text-xs font-bold text-[#FFBF00]">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{ep.title}</p>
                        <p className="text-[11px] text-[#888] truncate mt-0.5">
                          {ep.pubDate ? new Date(ep.pubDate).toLocaleDateString() : "Date inconnue"}
                          {ep.duration && ` • ${ep.duration}`}
                        </p>
                      </div>
                    </div>
                  ))}
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
                    "Confirmer et connecter le flux"
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
