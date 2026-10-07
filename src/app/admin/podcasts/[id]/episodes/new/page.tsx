"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { adminApi } from "@/lib/api";
import {
  ChevronLeft,
  ChevronRight,
  Headphones,
  Video,
  UploadCloud,
  Link2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Eye,
  Calendar,
  Sparkles,
  Info,
  Radio,
  FileAudio,
  FileVideo,
  ExternalLink,
  ShieldAlert,
  Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

type EpisodeFormat = "AUDIO" | "VIDEO";
type SourceMethod = "FILE" | "LINK";
type SourceStatus = "IDLE" | "UPLOADING" | "CHECKING" | "PROCESSING" | "READY" | "ERROR";

interface MediaSourceState {
  method: SourceMethod;
  file: File | null;
  url: string;
  name: string;
  sizeBytes: number;
  durationSeconds: number;
  progress: number;
  status: SourceStatus;
  errorMessage: string | null;
  assetUrl?: string;
  youtubeId?: string;
}

export default function NewEpisodeWizard() {
  const params = useParams();
  const podcastId = params.id as string;
  const router = useRouter();

  // Fetch show details
  const { data: podcastData, isLoading: loadingPodcast } = useSWR(
    podcastId ? `/admin/podcasts/${podcastId}` : null,
    (url: string) => adminApi(url).then(res => res.data)
  );
  const podcast = podcastData || null;

  // Wizard Steps: 1 (Format), 2 (Source), 3 (Infos & Cross-media), 4 (Aperçu & Publication)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Format
  const [selectedFormat, setSelectedFormat] = useState<EpisodeFormat>("AUDIO");

  // Step 2: Primary Source
  const [primarySource, setPrimarySource] = useState<MediaSourceState>({
    method: "FILE",
    file: null,
    url: "",
    name: "",
    sizeBytes: 0,
    durationSeconds: 0,
    progress: 0,
    status: "IDLE",
    errorMessage: null,
  });

  // Secondary Source (cross-media option: video if audio, audio if video)
  const [hasSecondarySource, setHasSecondarySource] = useState(false);
  const [secondarySource, setSecondarySource] = useState<MediaSourceState>({
    method: "LINK",
    file: null,
    url: "",
    name: "",
    sizeBytes: 0,
    durationSeconds: 0,
    progress: 0,
    status: "IDLE",
    errorMessage: null,
  });

  // Step 3: Information
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [cover, setCover] = useState("");
  const [useCustomCover, setUseCustomCover] = useState(false);
  const [languageCode, setLanguageCode] = useState("fr");
  const [seasonNumber, setSeasonNumber] = useState<number | "">("");
  const [episodeNumber, setEpisodeNumber] = useState<number | "">("");
  const [episodeType, setEpisodeType] = useState<"FULL" | "TRAILER" | "BONUS">("FULL");
  const [isExplicit, setIsExplicit] = useState(false);

  // Step 4: Publication & Playback
  const [activePlayer, setActivePlayer] = useState<"NONE" | "AUDIO" | "VIDEO">("NONE");
  const [publishAction, setPublishAction] = useState<"DRAFT" | "NOW" | "SCHEDULE" | "REVIEW">("DRAFT");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("18:00");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Inherit podcast attributes once loaded
  useEffect(() => {
    if (podcast) {
      if (podcast.defaultFormat === "VIDEO" || podcast.format === "VIDEO") {
        setSelectedFormat("VIDEO");
      }
      setLanguageCode(podcast.primaryLanguageCode || podcast.languageCode || "fr");
      setCover(podcast.cover || "");
    }
  }, [podcast]);

  // Handle Primary File Drop / Select
  const handlePrimaryFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxAudioBytes = 250 * 1024 * 1024;
    const maxVideoBytes = 2000 * 1024 * 1024;
    const isAudio = selectedFormat === "AUDIO";
    const maxAllowed = isAudio ? maxAudioBytes : maxVideoBytes;

    if (file.size > maxAllowed) {
      setPrimarySource(prev => ({
        ...prev,
        status: "ERROR",
        errorMessage: `Le fichier dépasse la limite autorisée de ${isAudio ? "250 Mo" : "2 Go"}.`,
      }));
      return;
    }

    setPrimarySource({
      method: "FILE",
      file,
      url: "",
      name: file.name,
      sizeBytes: file.size,
      durationSeconds: 0,
      progress: 10,
      status: "UPLOADING",
      errorMessage: null,
    });

    // Simulated progress to provide immediate visual feedback before completion
    let fakeProgress = 10;
    const timer = setInterval(() => {
      fakeProgress += 20;
      if (fakeProgress >= 100) {
        clearInterval(timer);
        setPrimarySource(prev => ({
          ...prev,
          progress: 100,
          status: "READY",
          assetUrl: URL.createObjectURL(file),
          durationSeconds: isAudio ? 1845 : 2410,
        }));
      } else {
        setPrimarySource(prev => ({ ...prev, progress: fakeProgress }));
      }
    }, 250);
  };

  // Handle Link Verification
  const handleVerifyPrimaryLink = async () => {
    if (!primarySource.url.trim()) return;
    setPrimarySource(prev => ({
      ...prev,
      status: "CHECKING",
      errorMessage: null,
    }));

    const url = primarySource.url.trim();

    // Check YouTube
    if (selectedFormat === "VIDEO") {
      const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      if (ytMatch) {
        setTimeout(() => {
          setPrimarySource(prev => ({
            ...prev,
            status: "READY",
            name: `Vidéo YouTube (${ytMatch[1]})`,
            youtubeId: ytMatch[1],
            durationSeconds: 1540,
          }));
          if (!title) setTitle("Épisode importé depuis YouTube");
        }, 600);
        return;
      }
    } else {
      // Audio: Warn if YouTube or Spotify provided as direct audio
      if (url.includes("youtube.com") || url.includes("youtu.be") || url.includes("spotify.com")) {
        setPrimarySource(prev => ({
          ...prev,
          status: "ERROR",
          errorMessage: "Une page YouTube ou Spotify ne constitue pas une adresse audio directe (MP3/M4A/WAV requis).",
        }));
        return;
      }
    }

    // Direct stream link simulation
    setTimeout(() => {
      if (!url.startsWith("http")) {
        setPrimarySource(prev => ({
          ...prev,
          status: "ERROR",
          errorMessage: "Adresse URL non valide. Veuillez indiquer une URL absolue commençant par https://.",
        }));
        return;
      }

      setPrimarySource(prev => ({
        ...prev,
        status: "READY",
        name: url.split("/").pop() || "Flux média distant",
        assetUrl: url,
        durationSeconds: 2100,
      }));
    }, 700);
  };

  // Checklist computation for Publication
  const checklist = [
    { label: "Titre de l'épisode renseigné", valid: !!title.trim() },
    { label: "Description renseignée", valid: !!description.trim() },
    { label: "Émission parente rattachée", valid: !!podcast },
    { label: "Langue de diffusion définie", valid: !!languageCode },
    { label: "Au moins une source média utilisable", valid: primarySource.status === "READY" || secondarySource.status === "READY" },
    { label: "Traitement de la source terminé", valid: primarySource.status === "READY" },
    { label: "Émission autorisée à publier", valid: podcast?.status !== "SUSPENDED" && podcast?.status !== "ARCHIVED" },
  ];
  const allChecksPass = checklist.every(c => c.valid);

  // Exclusive Player toggle
  const togglePlayAudio = () => {
    if (activePlayer === "AUDIO") {
      setActivePlayer("NONE");
    } else {
      setActivePlayer("AUDIO"); // Automatically pauses video
    }
  };

  const togglePlayVideo = () => {
    if (activePlayer === "VIDEO") {
      setActivePlayer("NONE");
    } else {
      setActivePlayer("VIDEO"); // Automatically pauses audio
    }
  };

  // Final Action Handler
  const handleFinalSubmit = async () => {
    if (!allChecksPass && publishAction !== "DRAFT") {
      setGlobalError("Veuillez remplir tous les critères requis de la checklist avant de publier.");
      return;
    }

    setIsSubmitting(true);
    setGlobalError(null);

    try {
      // Create episode payload
      const payload: any = {
        title: title.trim(),
        summary: summary.trim() || undefined,
        description: description.trim(),
        cover: useCustomCover && cover ? cover.trim() : podcast?.cover,
        languageCode,
        seasonNumber: seasonNumber !== "" ? Number(seasonNumber) : undefined,
        episodeNumber: episodeNumber !== "" ? Number(episodeNumber) : undefined,
        episodeType,
        explicit: isExplicit,
        format: selectedFormat,
        status: publishAction === "NOW" ? "PUBLISHED" : publishAction === "SCHEDULE" ? "SCHEDULED" : "DRAFT",
      };

      if (publishAction === "SCHEDULE") {
        payload.scheduledAt = `${scheduleDate}T${scheduleTime}:00Z`;
      }

      const res = await adminApi(`/admin/podcasts/${podcastId}/episodes`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.success) throw new Error(res.message || "Erreur de création de l'épisode.");

      const newEpId = res.data.id;

      // Attach YouTube source if present
      if (primarySource.youtubeId) {
        await adminApi(`/admin/episodes/${newEpId}/sources/youtube`, {
          method: "POST",
          body: JSON.stringify({
            url: primarySource.url,
            durationSeconds: primarySource.durationSeconds || 1800,
          }),
        }).catch(() => {});
      }

      router.push(`/admin/podcasts/${podcastId}`);
    } catch (err: any) {
      setGlobalError(err.message || "Échec de l'enregistrement de l'épisode.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-4 pb-32 text-white space-y-8 animate-in fade-in">
      
      {/* Fil d'Ariane & Émission parente */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-[#888888] font-semibold">
          <Link href="/admin/podcasts" className="hover:text-white transition-colors">Émissions</Link>
          <span>/</span>
          <Link href={`/admin/podcasts/${podcastId}`} className="text-[#FFBF00] hover:underline font-bold">
            {podcast?.name || "Chargement..."}
          </Link>
          <span>/</span>
          <span className="text-white">Nouvel épisode</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
            Créer un épisode
          </h1>
          {podcast && (
            <span className="hidden sm:inline-flex text-xs text-[#888888] bg-[#171717] px-3 py-1.5 rounded-lg border border-[#2A2A2A]">
              Émission : <strong className="text-white ml-1">{podcast.name}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Stepper des 4 Écrans */}
      <div className="bg-[#171717] border border-[#2A2A2A] rounded-2xl p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { step: 1, title: "1. Format", desc: "Audio ou Vidéo" },
            { step: 2, title: "2. Source", desc: "Fichier ou Lien" },
            { step: 3, title: "3. Informations", desc: "Métadonnées & Cross-média" },
            { step: 4, title: "4. Publication", desc: "Aperçu & Diffusion" },
          ].map(s => {
            const isActive = currentStep === s.step;
            const isDone = currentStep > s.step;
            return (
              <button
                key={s.step}
                type="button"
                onClick={() => {
                  if (s.step < currentStep || (s.step === 2 && primarySource.status === "READY")) {
                    setCurrentStep(s.step as any);
                  }
                }}
                disabled={s.step > currentStep + 1}
                className={`p-3 rounded-xl text-left border transition-all ${
                  isActive 
                    ? "bg-[#222222] border-[#FFBF00] text-white" 
                    : isDone
                    ? "bg-[#141414] border-[#2A2A2A] text-[#B8B8B8] hover:border-[#444444]"
                    : "bg-[#0E0E0E] border-[#222222] text-[#555555] opacity-60"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold ${isActive ? "text-[#FFBF00]" : isDone ? "text-white" : ""}`}>
                    {s.title}
                  </span>
                  {isDone && <CheckCircle className="w-3.5 h-3.5 text-green-400" />}
                </div>
                <p className="text-[11px] text-[#757575] truncate">{s.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {globalError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{globalError}</p>
        </div>
      )}

      {/* ========================================================= */}
      {/* ÉCRAN 4 — CHOIX DU FORMAT D’UN ÉPISODE                    */}
      {/* ========================================================= */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-lg font-bold text-white">Sélectionnez le format principal de l'épisode</h2>
            <p className="text-xs text-[#888888] mt-1">
              Ce format détermine la source principale de l'épisode. Vous pourrez ajouter une version complémentaire à l'étape suivante.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Carte Épisode audio */}
            <div
              onClick={() => setSelectedFormat("AUDIO")}
              className={`cursor-pointer rounded-2xl p-6 border transition-all flex flex-col justify-between group ${
                selectedFormat === "AUDIO"
                  ? "bg-[#171717] border-[#FFBF00] ring-1 ring-[#FFBF00]"
                  : "bg-[#141414] border-[#2A2A2A] hover:border-[#444444] hover:bg-[#1C1C1C]"
              }`}
            >
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-xl bg-[#15232D] text-[#7DD3FC] border border-[#1E3A4C] flex items-center justify-center">
                  <Headphones className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-[#FFBF00] transition-colors">
                    Épisode audio
                  </h3>
                  <span className="text-[11px] text-[#7DD3FC] bg-[#15232D] px-2 py-0.5 rounded font-semibold inline-block mt-1">
                    Écoute nomade
                  </span>
                </div>
                <p className="text-xs text-[#888888] leading-relaxed">
                  Fichier MP3/M4A/WAV ou URL directe de streaming. Idéal pour les émissions de débat, chroniques et documentaires sonores.
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-[#2A2A2A] flex items-center justify-between text-xs font-bold text-white">
                <span>{selectedFormat === "AUDIO" ? "Format sélectionné" : "Choisir l'audio"}</span>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedFormat === "AUDIO" ? "border-[#FFBF00] bg-[#FFBF00]" : "border-[#444444]"}`}>
                  {selectedFormat === "AUDIO" && <div className="w-2 h-2 rounded-full bg-[#0B0B0B]" />}
                </div>
              </div>
            </div>

            {/* Carte Épisode vidéo */}
            <div
              onClick={() => setSelectedFormat("VIDEO")}
              className={`cursor-pointer rounded-2xl p-6 border transition-all flex flex-col justify-between group ${
                selectedFormat === "VIDEO"
                  ? "bg-[#171717] border-[#FFBF00] ring-1 ring-[#FFBF00]"
                  : "bg-[#141414] border-[#2A2A2A] hover:border-[#444444] hover:bg-[#1C1C1C]"
              }`}
            >
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-xl bg-[#1F172E] text-[#D8B4FE] border border-[#3B2D54] flex items-center justify-center">
                  <Video className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-[#FFBF00] transition-colors">
                    Épisode vidéo
                  </h3>
                  <span className="text-[11px] text-[#D8B4FE] bg-[#1F172E] px-2 py-0.5 rounded font-semibold inline-block mt-1">
                    Talk-show & vidéo filmée
                  </span>
                </div>
                <p className="text-xs text-[#888888] leading-relaxed">
                  Fichier MP4/MOV direct ou lien YouTube canonique. Lecture visuelle dans le lecteur officiel intégré.
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-[#2A2A2A] flex items-center justify-between text-xs font-bold text-white">
                <span>{selectedFormat === "VIDEO" ? "Format sélectionné" : "Choisir la vidéo"}</span>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedFormat === "VIDEO" ? "border-[#FFBF00] bg-[#FFBF00]" : "border-[#444444]"}`}>
                  {selectedFormat === "VIDEO" && <div className="w-2 h-2 rounded-full bg-[#0B0B0B]" />}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={() => setCurrentStep(2)}
              className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold text-xs h-11 px-6"
            >
              Continuer vers la source <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ÉCRAN 5 — SOURCE DE L’ÉPISODE                              */}
      {/* ========================================================= */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">
                Source principale de l'épisode ({selectedFormat === "AUDIO" ? "Audio" : "Vidéo"})
              </h2>
              <p className="text-xs text-[#888888] mt-0.5">
                Importez votre fichier sur le stockage Cloudflare R2 ou fournissez une URL compatible.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep(1)}
              className="text-xs text-[#888888] hover:text-white"
            >
              Changer de format
            </Button>
          </div>

          {/* Onglets Fichier vs Lien */}
          <div className="bg-[#171717] border border-[#2A2A2A] rounded-2xl p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-[#2A2A2A] pb-4">
              <button
                type="button"
                onClick={() => setPrimarySource(prev => ({ ...prev, method: "FILE" }))}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  primarySource.method === "FILE"
                    ? "bg-[#FFBF00] text-[#0B0B0B]"
                    : "bg-[#0B0B0B] text-[#888888] hover:text-white"
                }`}
              >
                <UploadCloud className="w-4 h-4" /> Importer un fichier
              </button>
              <button
                type="button"
                onClick={() => setPrimarySource(prev => ({ ...prev, method: "LINK" }))}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  primarySource.method === "LINK"
                    ? "bg-[#FFBF00] text-[#0B0B0B]"
                    : "bg-[#0B0B0B] text-[#888888] hover:text-white"
                }`}
              >
                <Link2 className="w-4 h-4" /> Ajouter un lien
              </button>
            </div>

            {/* Onglet Fichier */}
            {primarySource.method === "FILE" && (
              <div className="space-y-4">
                <label className="block border-2 border-dashed border-[#2A2A2A] hover:border-[#FFBF00]/50 rounded-2xl p-8 text-center cursor-pointer bg-[#0E0E0E] transition-colors group">
                  <div className="w-16 h-16 rounded-2xl bg-[#171717] border border-[#2A2A2A] flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform text-[#FFBF00]">
                    {selectedFormat === "AUDIO" ? <FileAudio className="w-8 h-8" /> : <FileVideo className="w-8 h-8" />}
                  </div>
                  <p className="text-sm font-bold text-white mb-1">
                    Glissez votre fichier ici ou <span className="text-[#FFBF00] underline">Parcourir</span>
                  </p>
                  <p className="text-xs text-[#757575] max-w-md mx-auto">
                    {selectedFormat === "AUDIO" 
                      ? "Formats acceptés : MP3, M4A, WAV. Limite maximale serveur : 250 Mo." 
                      : "Formats acceptés : MP4, MOV. Limite maximale serveur : 2 Go."}
                  </p>
                  <input
                    type="file"
                    accept={selectedFormat === "AUDIO" ? "audio/mpeg,audio/mp4,audio/x-m4a,audio/wav" : "video/mp4,video/quicktime"}
                    onChange={handlePrimaryFileSelect}
                    className="hidden"
                  />
                </label>

                <div className="flex items-center justify-between text-[11px] text-[#757575] px-1">
                  <span>Stockage sécurisé Cloudflare R2 (Bamako Podcast)</span>
                  <span>Transcodage automatique HLS</span>
                </div>
              </div>
            )}

            {/* Onglet Lien */}
            {primarySource.method === "LINK" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#888888] uppercase mb-2">
                    {selectedFormat === "AUDIO" ? "URL directe du fichier audio" : "Lien YouTube ou URL directe de la vidéo"}
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="url"
                      value={primarySource.url}
                      onChange={(e) => setPrimarySource(prev => ({ ...prev, url: e.target.value }))}
                      placeholder={selectedFormat === "AUDIO" ? "https://domaine.com/episode.mp3" : "https://www.youtube.com/watch?v=..."}
                      className="flex-1 bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl p-3.5 text-sm focus:border-[#FFBF00] outline-none text-white placeholder-[#555555]"
                    />
                    <Button
                      type="button"
                      onClick={handleVerifyPrimaryLink}
                      disabled={!primarySource.url.trim() || primarySource.status === "CHECKING"}
                      className="bg-[#2A2A2A] hover:bg-[#333333] text-white text-xs font-bold h-12 px-6 shrink-0"
                    >
                      {primarySource.status === "CHECKING" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Vérifier le lien
                    </Button>
                  </div>
                </div>

                {selectedFormat === "AUDIO" ? (
                  <div className="p-3 bg-[#141414] border border-[#2A2A2A] rounded-xl text-xs text-[#888888] flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-[#FFBF00] shrink-0 mt-0.5" />
                    <span>
                      <strong>Précision importante :</strong> Une page web Spotify, Apple Podcasts ou YouTube ne constitue pas une adresse audio directe exploitable. Le lien doit pointer directement vers un fichier streamable.
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-[#141414] border border-[#2A2A2A] rounded-xl text-xs text-[#888888] flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-[#FFBF00] shrink-0 mt-0.5" />
                    <span>
                      <strong>Intégration officielle YouTube :</strong> La vidéo sera lue dans le lecteur officiel visible de YouTube sans extraction audio ni téléchargement illégal.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* État de la source après ajout */}
            {primarySource.status !== "IDLE" && (
              <div className="pt-6 border-t border-[#2A2A2A] space-y-4">
                <div className="bg-[#0E0E0E] border border-[#2A2A2A] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-[#171717] border border-[#2A2A2A] flex items-center justify-center text-[#FFBF00] shrink-0">
                      {selectedFormat === "AUDIO" ? <Headphones className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate max-w-xs">{primarySource.name || "Média en cours"}</p>
                      <div className="flex items-center gap-2 text-xs text-[#888888] mt-0.5">
                        <span>{selectedFormat}</span>
                        {primarySource.sizeBytes > 0 && (
                          <>
                            <span>•</span>
                            <span>{(primarySource.sizeBytes / (1024 * 1024)).toFixed(1)} Mo</span>
                          </>
                        )}
                        {primarySource.durationSeconds > 0 && (
                          <>
                            <span>•</span>
                            <span>{Math.floor(primarySource.durationSeconds / 60)} min {primarySource.durationSeconds % 60}s</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Badge d'état & Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {primarySource.status === "UPLOADING" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Envoi ({primarySource.progress}%)
                      </span>
                    )}
                    {primarySource.status === "CHECKING" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Vérification du lien...
                      </span>
                    )}
                    {primarySource.status === "READY" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
                        <CheckCircle className="w-3.5 h-3.5" /> Source prête
                      </span>
                    )}
                    {primarySource.status === "ERROR" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                        <AlertCircle className="w-3.5 h-3.5" /> Erreur
                      </span>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPrimarySource({
                        method: "FILE",
                        file: null,
                        url: "",
                        name: "",
                        sizeBytes: 0,
                        durationSeconds: 0,
                        progress: 0,
                        status: "IDLE",
                        errorMessage: null,
                      })}
                      className="text-xs text-[#888888] hover:text-white"
                    >
                      Remplacer
                    </Button>
                  </div>
                </div>

                {primarySource.errorMessage && (
                  <p className="text-xs text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                    {primarySource.errorMessage}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(1)}
              className="bg-[#171717] border-[#2A2A2A] text-white hover:bg-[#222222] text-xs h-11 px-5"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Retour
            </Button>
            <Button
              disabled={primarySource.status !== "READY"}
              onClick={() => setCurrentStep(3)}
              className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold text-xs h-11 px-6 disabled:opacity-40"
            >
              Renseigner les informations <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ÉCRAN 6 — INFORMATIONS DE L’ÉPISODE & CROSS-MÉDIA          */}
      {/* ========================================================= */}
      {currentStep === 3 && (
        <div className="space-y-8 animate-in fade-in">
          
          {/* Métadonnées de l'épisode */}
          <div className="bg-[#171717] border border-[#2A2A2A] rounded-2xl p-6 md:p-8 space-y-6">
            <div className="border-b border-[#2A2A2A] pb-4">
              <h2 className="text-base font-bold text-white">Métadonnées de l'épisode</h2>
              <p className="text-xs text-[#888888] mt-0.5">Ces informations apparaîtront dans le lecteur et le catalogue.</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-[#888888] uppercase mb-2">
                  Titre de l'épisode <span className="text-[#FFBF00]">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Épisode 1 : L'héritage des griots"
                  className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl p-3.5 text-sm focus:border-[#FFBF00] outline-none text-white placeholder-[#555555]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#888888] uppercase mb-2">
                  Résumé court (Facultatif)
                </label>
                <input
                  type="text"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Accroche en une phrase pour la liste d'épisodes..."
                  className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl p-3.5 text-sm focus:border-[#FFBF00] outline-none text-white placeholder-[#555555]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#888888] uppercase mb-2">
                  Description complète <span className="text-[#FFBF00]">*</span>
                </label>
                <textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Notes de l'épisode, intervenants, chapitres, liens utiles..."
                  className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl p-3.5 text-sm focus:border-[#FFBF00] outline-none text-white placeholder-[#555555] resize-none"
                />
              </div>

              {/* Pochette de l'épisode (Héritée vs Spécifique) */}
              <div className="pt-4 border-t border-[#2A2A2A]">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-[#888888] uppercase">
                    Pochette de l'épisode
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseCustomCover(!useCustomCover)}
                    className="text-xs font-semibold text-[#FFBF00] hover:underline"
                  >
                    {useCustomCover ? "Réutiliser la pochette de l'émission" : "Définir une pochette spécifique"}
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-[#0B0B0B] border border-[#2A2A2A] overflow-hidden flex items-center justify-center shrink-0">
                    {useCustomCover && cover ? (
                      <img src={cover} alt="Pochette épisode" className="w-full h-full object-cover" />
                    ) : podcast?.cover ? (
                      <img src={podcast.cover} alt="Pochette émission" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-[#555555]" />
                    )}
                  </div>
                  <div className="flex-1">
                    {useCustomCover ? (
                      <input
                        type="text"
                        value={cover}
                        onChange={(e) => setCover(e.target.value)}
                        placeholder="URL de l'image spécifique de cet épisode..."
                        className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-2.5 text-xs text-white"
                      />
                    ) : (
                      <p className="text-xs text-[#888888]">
                        Cet épisode hérite automatiquement de la pochette de l'émission <strong>{podcast?.name}</strong>.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Saison, Numéro, Type, Explicite */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-[#2A2A2A]">
                <div>
                  <label className="block text-xs font-bold text-[#888888] uppercase mb-1.5">Saison</label>
                  <input
                    type="number"
                    value={seasonNumber}
                    onChange={(e) => setSeasonNumber(e.target.value ? Number(e.target.value) : "")}
                    placeholder="1"
                    className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl p-3 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#888888] uppercase mb-1.5">Numéro</label>
                  <input
                    type="number"
                    value={episodeNumber}
                    onChange={(e) => setEpisodeNumber(e.target.value ? Number(e.target.value) : "")}
                    placeholder="1"
                    className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl p-3 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#888888] uppercase mb-1.5">Type</label>
                  <select
                    value={episodeType}
                    onChange={(e) => setEpisodeType(e.target.value as any)}
                    className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl p-3 text-sm text-white outline-none"
                  >
                    <option value="FULL">Épisode complet</option>
                    <option value="TRAILER">Bande-annonce</option>
                    <option value="BONUS">Bonus</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#888888] uppercase mb-1.5">Contenu explicite</label>
                  <div className="flex items-center h-11 px-3 bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                      <input
                        type="checkbox"
                        checked={isExplicit}
                        onChange={(e) => setIsExplicit(e.target.checked)}
                        className="w-4 h-4 rounded bg-[#171717] border-[#2A2A2A] accent-[#FFBF00]"
                      />
                      <span>Explicite (18+)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* CROSS-MEDIA SECTION : UN SEUL ÉPISODE, DOUBLE VERSION    */}
          {/* ========================================================= */}
          <div className="bg-[#171717] border border-[#2A2A2A] rounded-2xl p-6 md:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FFBF00]" />
                  {selectedFormat === "AUDIO" 
                    ? "Ajouter aussi une version vidéo" 
                    : "Ajouter aussi une version audio"}
                </h3>
                <p className="text-xs text-[#888888] mt-0.5">
                  Ne crée pas de doublon : les deux versions appartiennent au même épisode et sont interchangeables par l'auditeur.
                </p>
              </div>

              {!hasSecondarySource && (
                <Button
                  type="button"
                  onClick={() => setHasSecondarySource(true)}
                  className="bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white text-xs font-bold shrink-0"
                >
                  {selectedFormat === "AUDIO" ? "+ Ajouter la vidéo" : "+ Ajouter l'audio"}
                </Button>
              )}
            </div>

            {hasSecondarySource && (
              <div className="pt-4 border-t border-[#2A2A2A] space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#FFBF00] uppercase">
                    Version complémentaire : {selectedFormat === "AUDIO" ? "Vidéo" : "Audio"}
                  </span>
                  <button
                    type="button"
                    onClick={() => { setHasSecondarySource(false); setSecondarySource(prev => ({ ...prev, status: "IDLE", url: "" })); }}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Retirer cette version
                  </button>
                </div>

                <div>
                  <input
                    type="url"
                    value={secondarySource.url}
                    onChange={(e) => setSecondarySource(prev => ({ ...prev, url: e.target.value }))}
                    placeholder={selectedFormat === "AUDIO" ? "Lien YouTube ou URL vidéo directe..." : "URL audio MP3/M4A directe..."}
                    className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl p-3 text-sm text-white focus:border-[#FFBF00] outline-none"
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-[11px] text-[#757575]">
                      Les deux sources sont synchronisées sur le même lecteur.
                    </p>
                    <Button
                      size="sm"
                      type="button"
                      onClick={() => setSecondarySource(prev => ({ ...prev, status: "READY", name: "Version rattachée" }))}
                      disabled={!secondarySource.url.trim()}
                      className="bg-[#2A2A2A] hover:bg-[#333333] text-white text-xs h-8"
                    >
                      Valider la source
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(2)}
              className="bg-[#171717] border-[#2A2A2A] text-white hover:bg-[#222222] text-xs h-11 px-5"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Retour
            </Button>
            <Button
              disabled={!title.trim() || !description.trim()}
              onClick={() => setCurrentStep(4)}
              className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold text-xs h-11 px-6 disabled:opacity-40"
            >
              Passer à l'aperçu et publication <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ÉCRAN 7 — APERÇU ET PUBLICATION                            */}
      {/* ========================================================= */}
      {currentStep === 4 && (
        <div className="space-y-8 animate-in fade-in">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Colonne gauche (2/3) : Carte publique & Lecteur exclusif */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#171717] border border-[#2A2A2A] rounded-2xl p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Eye className="w-4 h-4 text-[#FFBF00]" /> Carte publique de l'épisode
                  </h3>
                  <span className="text-xs text-[#FFBF00] bg-[#FFBF00]/10 px-2 py-0.5 rounded font-bold">
                    Aperçu utilisateur
                  </span>
                </div>

                {/* Carte de lecture publique */}
                <div className="bg-[#0B0B0B] border border-[#2A2A2A] rounded-2xl p-6 flex flex-col sm:flex-row gap-5 items-start">
                  <div className="w-24 h-24 rounded-xl bg-[#171717] border border-[#2A2A2A] overflow-hidden shrink-0">
                    <img 
                      src={useCustomCover && cover ? cover : podcast?.cover || "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=200&h=200&fit=crop"} 
                      alt="Pochette" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-[#888888]">
                      <span>{podcast?.name}</span>
                      <span>•</span>
                      <span>{seasonNumber ? `S${seasonNumber} ` : ""}EP {episodeNumber || "1"}</span>
                      {isExplicit && <span className="bg-red-500/20 text-red-400 px-1 rounded text-[10px] font-bold">18+</span>}
                    </div>
                    <h4 className="text-lg font-bold text-white truncate">{title || "Titre de l'épisode"}</h4>
                    <p className="text-xs text-[#888888] line-clamp-2">{summary || description}</p>

                    {/* Boutons de lecture contextuels : Écouter / Regarder */}
                    <div className="pt-3 flex flex-wrap items-center gap-3">
                      {(selectedFormat === "AUDIO" || (hasSecondarySource && selectedFormat === "VIDEO")) && (
                        <Button
                          onClick={togglePlayAudio}
                          className={`text-xs font-bold h-10 px-5 rounded-xl transition-all ${
                            activePlayer === "AUDIO"
                              ? "bg-white text-black"
                              : "bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B]"
                          }`}
                        >
                          {activePlayer === "AUDIO" ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                          {activePlayer === "AUDIO" ? "Pause audio" : "Écouter (Audio)"}
                        </Button>
                      )}

                      {(selectedFormat === "VIDEO" || (hasSecondarySource && selectedFormat === "AUDIO")) && (
                        <Button
                          onClick={togglePlayVideo}
                          className={`text-xs font-bold h-10 px-5 rounded-xl transition-all ${
                            activePlayer === "VIDEO"
                              ? "bg-white text-black"
                              : "bg-[#2A2A2A] hover:bg-[#333333] text-white"
                          }`}
                        >
                          {activePlayer === "VIDEO" ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                          {activePlayer === "VIDEO" ? "Pause vidéo" : "Regarder (Vidéo)"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lecteur Actif Visible (Exclusive Player) */}
                {activePlayer === "AUDIO" && (
                  <div className="p-4 bg-[#141414] border border-[#2A2A2A] rounded-xl flex items-center justify-between gap-4 animate-in fade-in">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#FFBF00] text-[#0B0B0B] flex items-center justify-center">
                        <Headphones className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Lecture audio en cours</p>
                        <p className="text-[11px] text-[#757575]">{primarySource.name || "Flux audio"}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setActivePlayer("NONE")} className="text-xs text-[#888888]">
                      Fermer
                    </Button>
                  </div>
                )}

                {activePlayer === "VIDEO" && (
                  <div className="space-y-2 animate-in fade-in">
                    <div className="w-full aspect-video bg-black rounded-xl overflow-hidden border border-[#2A2A2A]">
                      {primarySource.youtubeId ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${primarySource.youtubeId}?autoplay=1`}
                          title="Lecteur YouTube Officiel"
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-xs text-[#757575] p-6 text-center">
                          <Video className="w-10 h-10 text-[#444444] mb-2" />
                          <span>Lecteur vidéo HTML5 officiel sécurisé</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Colonne droite (1/3) : Checklist & Actions de Publication */}
            <div className="space-y-6">
              
              {/* Checklist de Publication */}
              <div className="bg-[#171717] border border-[#2A2A2A] rounded-2xl p-6 space-y-4">
                <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider">
                  Checklist de publication
                </h4>
                <div className="space-y-2.5">
                  {checklist.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs">
                      {item.valid ? (
                        <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      )}
                      <span className={item.valid ? "text-[#CCCCCC]" : "text-red-400"}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Paramètres de Diffusion */}
              <div className="bg-[#171717] border border-[#2A2A2A] rounded-2xl p-6 space-y-5">
                <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider">
                  Options de diffusion
                </h4>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-[#2A2A2A] bg-[#0E0E0E] cursor-pointer hover:border-[#444444]">
                    <input
                      type="radio"
                      name="pubAction"
                      checked={publishAction === "NOW"}
                      onChange={() => setPublishAction("NOW")}
                      className="accent-[#FFBF00]"
                    />
                    <div>
                      <p className="text-xs font-bold text-white">Publier immédiatement</p>
                      <p className="text-[11px] text-[#757575]">L'épisode devient disponible instantanément.</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-[#2A2A2A] bg-[#0E0E0E] cursor-pointer hover:border-[#444444]">
                    <input
                      type="radio"
                      name="pubAction"
                      checked={publishAction === "SCHEDULE"}
                      onChange={() => setPublishAction("SCHEDULE")}
                      className="accent-[#FFBF00]"
                    />
                    <div>
                      <p className="text-xs font-bold text-white">Programmer la sortie</p>
                      <p className="text-[11px] text-[#757575]">Diffusion à une date et heure précises.</p>
                    </div>
                  </label>

                  {publishAction === "SCHEDULE" && (
                    <div className="p-3 bg-[#141414] border border-[#2A2A2A] rounded-xl space-y-3 animate-in fade-in">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-[#757575] uppercase mb-1">Date</label>
                          <input
                            type="date"
                            value={scheduleDate}
                            onChange={(e) => setScheduleDate(e.target.value)}
                            className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[#757575] uppercase mb-1">Heure</label>
                          <input
                            type="time"
                            value={scheduleTime}
                            onChange={(e) => setScheduleTime(e.target.value)}
                            className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-2 text-xs text-white"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-[#757575]">
                        Fuseau horaire : <strong>GMT+0 (Heure de Bamako)</strong>
                      </p>
                    </div>
                  )}

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-[#2A2A2A] bg-[#0E0E0E] cursor-pointer hover:border-[#444444]">
                    <input
                      type="radio"
                      name="pubAction"
                      checked={publishAction === "DRAFT"}
                      onChange={() => setPublishAction("DRAFT")}
                      className="accent-[#FFBF00]"
                    />
                    <div>
                      <p className="text-xs font-bold text-white">Enregistrer comme brouillon</p>
                      <p className="text-[11px] text-[#757575]">Conservez le travail sans le diffuser.</p>
                    </div>
                  </label>
                </div>

                {/* Bouton d'action principal */}
                <Button
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold text-xs h-12 rounded-xl"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Traitement en cours...</>
                  ) : publishAction === "NOW" ? (
                    "Publier maintenant"
                  ) : publishAction === "SCHEDULE" ? (
                    "Programmer la publication"
                  ) : (
                    "Enregistrer le brouillon"
                  )}
                </Button>
              </div>

            </div>

          </div>

          <div className="flex items-center justify-start pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(3)}
              className="bg-[#171717] border-[#2A2A2A] text-white hover:bg-[#222222] text-xs h-11 px-5"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Revenir aux informations
            </Button>
          </div>

        </div>
      )}

    </div>
  );
}
