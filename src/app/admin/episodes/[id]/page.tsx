"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import useSWR from "swr";
import { ChevronLeft, Save, Upload, Plus, Trash2, Youtube, Headphones, CheckCircle2, Play, Image as ImageIcon, Loader2, Link2, X, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

export default function AdminEditEpisodePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const fetcher = (url: string) => adminApi(url).then(res => res.data);
  const { data: episode, mutate, error } = useSWR(`/admin/episodes/${id}`, fetcher);

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [actionError, setActionError] = useState("");
  const saveInFlight = useRef<Promise<boolean> | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("");
  const [seasonNumber, setSeasonNumber] = useState<number | "">("");
  const [episodeNumber, setEpisodeNumber] = useState<number | "">("");
  const [episodeType, setEpisodeType] = useState("FULL");
  const [explicit, setExplicit] = useState(false);
  const [topics, setTopics] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState("");
  const [coverUrl, setCoverUrl] = useState("");

  // Source Audio states
  const [audioUrlInput, setAudioUrlInput] = useState("");
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Source YouTube states
  const [youtubeUrlInput, setYoutubeUrlInput] = useState("");
  const [checkingYoutube, setCheckingYoutube] = useState(false);
  const [youtubePreview, setYoutubePreview] = useState<any>(null);
  
  // Preview states
  const [previewMode, setPreviewMode] = useState<"AUDIO" | "YOUTUBE" | null>(null);

  // Derived source states
  const audioSource = episode?.sources?.audio;
  const audioStatus = episode?.sources?.audioState || episode?.audioStatus || (audioSource ? "READY" : "NONE");
  const effectiveAudioUrl = audioSource?.url || episode?.audioUrl || "";
  const audioProcessing = audioStatus === "PROCESSING" || audioStatus === "UPLOADING";
  const hasAudioReady = audioStatus === "READY" || !!effectiveAudioUrl;

  const youtubeSource = episode?.sources?.youtube;
  const effectiveYoutubeId = youtubeSource?.videoId || episode?.youtubeId || "";
  const hasYoutubeReady = !!effectiveYoutubeId;
  const hasSource = hasAudioReady || hasYoutubeReady;

  useEffect(() => {
    if (episode) {
      setTitle(episode.title || "");
      setSummary(episode.summary || "");
      setDescription(episode.description || "");
      setLanguage(episode.languageCode || episode.language || episode.podcast?.primaryLanguageCode || episode.podcast?.language || "fr");
      setSeasonNumber(episode.seasonNumber ?? episode.season?.number ?? "");
      setEpisodeNumber(episode.episodeNumber ?? "");
      setEpisodeType(episode.episodeType || "FULL");
      setExplicit(episode.explicit || false);
      setCoverUrl(episode.cover || episode.coverUrl || episode.podcast?.cover || episode.podcast?.coverUrl || "");
      setTopics(episode.topics?.map((t: any) => t.topic.name) || []);
      
      const ytId = episode.sources?.youtube?.videoId || episode.youtubeId;
      const aUrl = episode.sources?.audio?.url || episode.audioUrl;
      const aStatus = episode.sources?.audioState || episode.audioStatus;

      if (!previewMode) {
        if (ytId) setPreviewMode("YOUTUBE");
        else if (aUrl || aStatus === "READY") setPreviewMode("AUDIO");
      }
    }
  }, [episode, previewMode]);

  if (!episode && !error) {
    return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#757575]" /></div>;
  }
  if (error) {
    return <div className="p-12 text-center text-red-500">Erreur lors du chargement de l'épisode.</div>;
  }

  const podcast = episode?.podcast;

  const handleSaveInfo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (saveInFlight.current) {
      const succeeded = await saveInFlight.current;
      if (!succeeded) return false;
    }
    setSaving(true);
    setActionError("");
    const operation = (async () => {
    try {
      const res = await adminApi(`/admin/episodes/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title,
          summary,
          description,
          languageCode: language,
          cover: coverUrl,
          seasonNumber: seasonNumber === "" ? null : Number(seasonNumber),
          episodeNumber: episodeNumber === "" ? null : Number(episodeNumber),
          episodeType,
          explicit,
        }),
      });
      if (res.data) mutate(res.data, { revalidate: true }); else mutate();
      return true;
    } catch (err: any) {
      setActionError(err.message || "Erreur lors de l'enregistrement");
      return false;
    } finally {
      setSaving(false);
    }
    })();
    saveInFlight.current = operation;
    try { return await operation; }
    finally { if (saveInFlight.current === operation) saveInFlight.current = null; }
  };

  const handlePublish = async (status: "PUBLISHED" | "DRAFT" | "SCHEDULED", scheduledAt?: string) => {
    if (publishing) return;
    setPublishing(true);
    try {
      if (!await handleSaveInfo()) return;
      let res;
      if (status === "DRAFT") {
        res = await adminApi(`/admin/episodes/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: "DRAFT" })
        });
      } else {
        res = await adminApi(`/admin/episodes/${id}/publish`, {
          method: "POST",
          body: JSON.stringify({
            mode: status === "SCHEDULED" ? "schedule" : "now",
            publishAt: scheduledAt,
          })
        });
      }
      if (res.data) mutate(res.data, { revalidate: true }); else mutate();
    } catch (err: any) {
      setActionError(err.message || "Erreur lors de la publication");
    } finally {
      setPublishing(false);
    }
  };

  const handleSetAudioUrl = async () => {
    if (!audioUrlInput) return;
    try {
      await adminApi(`/admin/episodes/${id}/audio/url`, {
        method: "POST",
        body: JSON.stringify({ url: audioUrlInput })
      });
      setAudioUrlInput("");
      mutate();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Erreur ou URL invalide");
    }
  };

  const handleRemoveAudio = async () => {
    if (!confirm("Retirer la source audio ?")) return;
    try {
      await adminApi(`/admin/episodes/${id}/audio`, { method: "DELETE" });
      mutate();
    } catch (err: any) { console.error(err); }
  };

  const handlePreviewYoutube = async () => {
    if (!youtubeUrlInput) return;
    setCheckingYoutube(true);
    setYoutubePreview(null);
    try {
      const res = await adminApi(`/admin/media/youtube/preview`, {
        method: "POST",
        body: JSON.stringify({ url: youtubeUrlInput })
      });
      if (res.success && res.data) {
        setYoutubePreview(res.data);
      } else {
        alert("Vidéo introuvable ou privée.");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Vidéo introuvable ou privée.");
    } finally {
      setCheckingYoutube(false);
    }
  };

  const handleConfirmYoutube = async () => {
    if (!youtubePreview) return;
    try {
      await adminApi(`/admin/episodes/${id}/youtube`, {
        method: "POST",
        body: JSON.stringify({
          url: youtubePreview.watchUrl || youtubeUrlInput,
          durationSeconds: youtubePreview.durationSeconds
        })
      });
      setYoutubePreview(null);
      setYoutubeUrlInput("");
      mutate();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Erreur lors de l'association YouTube");
    }
  };

  const handleRemoveYoutube = async () => {
    if (!confirm("Retirer la vidéo YouTube ?")) return;
    try {
      await adminApi(`/admin/episodes/${id}/youtube`, { method: "DELETE" });
      mutate();
    } catch (err: any) { console.error(err); }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAudio(true);
    setUploadProgress(0);
    try {
      const res = await adminApi(`/admin/episodes/${id}/audio/uploads`, {
        method: "POST",
        body: JSON.stringify({ filename: file.name, mimeType: file.type || "audio/mpeg", sizeBytes: file.size })
      });
      if (!res.success) throw new Error(res.message || "Impossible de créer la session d'envoi");
      
      const { uploadUrl, uploadId } = res.data;
      
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader("Content-Type", file.type || "audio/mpeg");
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      };
      
      await new Promise((resolve, reject) => {
        xhr.onload = () => { if (xhr.status >= 200 && xhr.status < 300) resolve(true); else reject(new Error("Échec du transfert vers le stockage (S3/R2)")); };
        xhr.onerror = () => reject(new Error("Erreur réseau lors de l'envoi du fichier"));
        xhr.send(file);
      });

      await adminApi(`/admin/episodes/${id}/audio/uploads/${uploadId}/complete`, { method: "POST" });
      mutate();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Erreur lors de l'envoi");
    } finally {
      setUploadingAudio(false);
      setUploadProgress(0);
    }
  };

  // Conditions de publication
  const hasTitle = !!title.trim() && title.trim() !== "Nouvel épisode";
  const hasPodcast = !!podcast;
  const hasLanguage = !!language.trim();
  const canPublish = hasTitle && hasPodcast && hasLanguage && hasSource && !audioProcessing;

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center gap-4 text-sm text-[#757575]">
        <Link href="/admin/podcasts" className="hover:text-white transition-colors">Podcasts</Link>
        <span>/</span>
        <Link href={`/admin/podcasts/${podcast?.slug || podcast?.id}`} className="hover:text-white transition-colors">{podcast?.title || "Podcast"}</Link>
        <span>/</span>
        <span className="text-white">Édition de l'épisode</span>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">{title || "Nouvel épisode"}</h1>
          <p className="text-sm text-[#757575]">
            État : {episode.status === "PUBLISHED" ? <span className="text-green-500">Publié</span> : episode.status === "SCHEDULED" ? <span className="text-yellow-500">Programmé</span> : "Brouillon"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" disabled={saving || publishing} className="border-[#2A2A2A] text-white hover:bg-[#1A1A1A]" onClick={() => handlePublish("DRAFT")}>
            Enregistrer le brouillon
          </Button>
          <Button 
            className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold" 
            disabled={!canPublish || publishing}
            onClick={() => handlePublish("PUBLISHED")}
          >
            {publishing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Publier maintenant
          </Button>
        </div>
      </div>

      {actionError && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{actionError}</div>}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* COLONNE GAUCHE : Formulaires */}
        <div className="flex-1 space-y-8">
          
          {/* 1. Informations de l'épisode */}
          <div className="bg-[#171717] border border-[#2A2A2A] rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-6">1. Informations de l'épisode</h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-[#757575] uppercase mb-2">Titre *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} onBlur={handleSaveInfo} className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white" />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#757575] uppercase mb-2">Résumé court</label>
                <input type="text" value={summary} onChange={e => setSummary(e.target.value)} onBlur={handleSaveInfo} className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white" placeholder="Utilisé dans les cartes (optionnel)" />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#757575] uppercase mb-2">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} onBlur={handleSaveInfo} className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white h-32 resize-y" placeholder="Présentation complète, liens et intervenants" />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-[#757575] uppercase mb-2">Langue principale</label>
                  <select value={language} onChange={e => { setLanguage(e.target.value); handleSaveInfo(); }} className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white appearance-none">
                    <option value="fr">Français</option>
                    <option value="bm">Bamanankan (Bambara)</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#757575] uppercase mb-2">Type d'épisode</label>
                  <select value={episodeType} onChange={e => { setEpisodeType(e.target.value); handleSaveInfo(); }} className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white appearance-none">
                    <option value="FULL">Épisode complet</option>
                    <option value="TRAILER">Bande-annonce</option>
                    <option value="BONUS">Bonus</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-[#757575] uppercase mb-2">Saison (opt.)</label>
                  <input type="number" value={seasonNumber} onChange={e => setSeasonNumber(e.target.value ? Number(e.target.value) : "")} onBlur={handleSaveInfo} className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#757575] uppercase mb-2">Numéro (opt.)</label>
                  <input type="number" value={episodeNumber} onChange={e => setEpisodeNumber(e.target.value ? Number(e.target.value) : "")} onBlur={handleSaveInfo} className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white" />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <input type="checkbox" id="explicit" checked={explicit} onChange={e => { setExplicit(e.target.checked); handleSaveInfo(); }} className="w-4 h-4 bg-[#0B0B0B] border-[#2A2A2A] rounded accent-[#FFBF00]" />
                <label htmlFor="explicit" className="text-sm text-white">Contenu explicite (langage injurieux, etc.)</label>
              </div>
            </div>
          </div>

          {/* 2. Sources de lecture */}
          <div className="bg-[#171717] border border-[#2A2A2A] rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-6">2. Sources de lecture</h2>
            
            <div className="space-y-8">
              {/* AUDIO */}
              <div className="bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Headphones className="w-5 h-5 text-blue-400" />
                  <h3 className="font-bold text-white">Version audio</h3>
                </div>

                {audioProcessing && (
                  <div className="bg-blue-500/10 border border-blue-500/30 text-blue-400 p-4 rounded-lg flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <div>
                      <p className="font-bold text-sm">Traitement en cours</p>
                      <p className="text-xs opacity-80">Votre fichier audio est en cours d'optimisation.</p>
                    </div>
                  </div>
                )}

                {hasAudioReady && (
                  <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-4 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#2A2A2A] rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{effectiveAudioUrl?.split('/').pop() || audioSource?.filename || "Fichier audio prêt"}</p>
                        <p className="text-xs text-[#757575]">Fichier prêt • {Math.round(audioSource?.durationSeconds ? audioSource.durationSeconds / 60 : ((episode.durationMs || 0) / 60000))} min</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="border-[#2A2A2A] text-white hover:bg-[#2A2A2A]" onClick={() => setPreviewMode("AUDIO")}>Aperçu</Button>
                      <Button variant="outline" size="sm" className="border-[#2A2A2A] text-red-500 hover:bg-[#2A2A2A] hover:text-red-400" onClick={handleRemoveAudio}>Retirer</Button>
                    </div>
                  </div>
                )}

                {!hasAudioReady && !audioProcessing && (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-[#2A2A2A] rounded-lg p-6 text-center hover:border-[#FFBF00] transition-colors relative cursor-pointer">
                      <input type="file" accept="audio/*" onChange={handleAudioUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={uploadingAudio} />
                      <Upload className="w-6 h-6 text-[#757575] mx-auto mb-2" />
                      <p className="text-sm text-white font-bold mb-1">
                        {uploadingAudio ? `Envoi en cours... ${uploadProgress}%` : "Déposer un fichier audio ou parcourir"}
                      </p>
                      <p className="text-xs text-[#757575]">MP3, M4A, WAV (Max 250 Mo)</p>
                      
                      {uploadingAudio && (
                        <div className="mt-4 h-1.5 w-full bg-[#2A2A2A] rounded-full overflow-hidden">
                          <div className="h-full bg-[#FFBF00]" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="h-px bg-[#2A2A2A] flex-1"></div>
                      <span className="text-xs text-[#757575] font-bold uppercase">Ou utiliser une adresse directe</span>
                      <div className="h-px bg-[#2A2A2A] flex-1"></div>
                    </div>

                    <div className="flex gap-2">
                      <input type="url" value={audioUrlInput} onChange={e => setAudioUrlInput(e.target.value)} placeholder="https://..." className="flex-1 bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white" />
                      <Button onClick={handleSetAudioUrl} disabled={!audioUrlInput} className="bg-[#2A2A2A] text-white hover:bg-[#333]">Valider</Button>
                    </div>
                  </div>
                )}
              </div>

              {/* YOUTUBE */}
              <div className="bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Youtube className="w-5 h-5 text-red-500" />
                  <h3 className="font-bold text-white">Vidéo YouTube <span className="text-[#757575] font-normal">— facultative</span></h3>
                </div>

                {hasYoutubeReady && !youtubePreview && (
                  <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-4 rounded-lg flex flex-col sm:flex-row items-center gap-4 justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-14 bg-black rounded overflow-hidden relative flex-shrink-0">
                        <img src={`https://i.ytimg.com/vi/${effectiveYoutubeId}/mqdefault.jpg`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="w-6 h-6 text-white opacity-80" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white line-clamp-1">{episode.title}</p>
                        <p className="text-xs text-[#757575]">ID: {effectiveYoutubeId}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="border-[#2A2A2A] text-white hover:bg-[#2A2A2A]" onClick={() => setPreviewMode("YOUTUBE")}>Regarder</Button>
                      <Button variant="outline" size="sm" className="border-[#2A2A2A] text-red-500 hover:bg-[#2A2A2A] hover:text-red-400" onClick={handleRemoveYoutube}>Retirer</Button>
                    </div>
                  </div>
                )}

                {!hasYoutubeReady && !youtubePreview && (
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-[#757575] uppercase">Adresse de la vidéo</label>
                    <div className="flex gap-2">
                      <input type="url" value={youtubeUrlInput} onChange={e => setYoutubeUrlInput(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="flex-1 bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white" />
                      <Button onClick={handlePreviewYoutube} disabled={!youtubeUrlInput || checkingYoutube} className="bg-[#2A2A2A] text-white hover:bg-[#333]">
                        {checkingYoutube ? <Loader2 className="w-4 h-4 animate-spin" /> : "Vérifier la vidéo"}
                      </Button>
                    </div>
                  </div>
                )}

                {youtubePreview && (
                  <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-4 rounded-lg flex flex-col items-center text-center">
                    <img src={youtubePreview.thumbnailUrl || youtubePreview.thumbnail} className="w-48 rounded-lg shadow-lg mb-3" />
                    <h4 className="text-sm font-bold text-white mb-1">{youtubePreview.title}</h4>
                    <p className="text-xs text-[#757575] mb-4">{youtubePreview.channelTitle || youtubePreview.channel}</p>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setYoutubePreview(null)} className="border-[#2A2A2A] text-white hover:bg-[#2A2A2A]">Annuler</Button>
                      <Button onClick={handleConfirmYoutube} className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold">Confirmer cette vidéo</Button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>

        {/* COLONNE DROITE : Aperçu & Checklist */}
        <div className="w-full lg:w-[380px] space-y-6">
          
          <div className="bg-[#171717] border border-[#2A2A2A] rounded-xl p-5 sticky top-6">
            <h3 className="text-sm font-bold text-[#757575] uppercase mb-4">Aperçu public</h3>
            
            <div className="bg-[#0B0B0B] rounded-xl overflow-hidden border border-[#2A2A2A]">
              {/* Cover area */}
              <div className="aspect-video bg-[#2A2A2A] relative flex items-center justify-center overflow-hidden">
                {coverUrl ? (
                  <img src={coverUrl} className="absolute inset-0 w-full h-full object-cover blur-sm opacity-50" />
                ) : null}
                
                {previewMode === "YOUTUBE" && hasYoutubeReady ? (
                  <div className="absolute inset-0 z-10 bg-black">
                     <ReactPlayer
                        src={`https://www.youtube.com/watch?v=${effectiveYoutubeId}`}
                        width="100%"
                        height="100%"
                        controls
                        playing
                      />
                  </div>
                ) : (
                  <img src={coverUrl || "https://placehold.co/400x400/171717/333333?text=Cover"} className="w-24 h-24 rounded-lg shadow-2xl relative z-10 object-cover" />
                )}
              </div>
              
              <div className="p-4">
                <p className="text-[#FFBF00] text-xs font-bold mb-1 uppercase tracking-wider">{podcast?.title}</p>
                <h4 className="text-white font-bold text-lg leading-tight mb-2">{title || "Titre de l'épisode"}</h4>
                <p className="text-[#757575] text-xs line-clamp-2 mb-4">{summary || description || "Le résumé de l'épisode apparaîtra ici."}</p>
                
                {/* Audio Player if active */}
                {previewMode === "AUDIO" && hasAudioReady && effectiveAudioUrl && (
                  <div className="mb-4">
                    <audio src={effectiveAudioUrl} controls className="w-full h-10" />
                  </div>
                )}

                {/* Source Toggles */}
                <div className="flex gap-2">
                  {hasAudioReady && (
                    <Button 
                      variant={previewMode === "AUDIO" ? "default" : "outline"} 
                      size="sm" 
                      className={`flex-1 ${previewMode === "AUDIO" ? "bg-white text-black hover:bg-gray-200" : "border-[#2A2A2A] text-white hover:bg-[#1A1A1A]"}`}
                      onClick={() => setPreviewMode("AUDIO")}
                    >
                      <Headphones className="w-4 h-4 mr-2" /> Audio
                    </Button>
                  )}
                  {hasYoutubeReady && (
                    <Button 
                      variant={previewMode === "YOUTUBE" ? "default" : "outline"} 
                      size="sm" 
                      className={`flex-1 ${previewMode === "YOUTUBE" ? "bg-white text-black hover:bg-gray-200" : "border-[#2A2A2A] text-white hover:bg-[#1A1A1A]"}`}
                      onClick={() => setPreviewMode("YOUTUBE")}
                    >
                      <Youtube className="w-4 h-4 mr-2" /> Regarder
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="mt-6 border-t border-[#2A2A2A] pt-6">
              <h3 className="text-sm font-bold text-white mb-4">Prêt pour publication ?</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm">
                  {hasTitle ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-[#2A2A2A]" />}
                  <span className={hasTitle ? "text-[#B8B8B8]" : "text-[#757575]"}>Titre renseigné</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  {hasPodcast ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-[#2A2A2A]" />}
                  <span className={hasPodcast ? "text-[#B8B8B8]" : "text-[#757575]"}>Podcast sélectionné</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  {hasLanguage ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-[#2A2A2A]" />}
                  <span className={hasLanguage ? "text-[#B8B8B8]" : "text-[#757575]"}>Langue renseignée</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  {hasSource ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-[#2A2A2A]" />}
                  <span className={hasSource ? "text-[#B8B8B8]" : "text-[#757575]"}>Une source de lecture disponible</span>
                </li>
                {audioProcessing && (
                  <li className="flex items-center gap-3 text-sm">
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    <span className="text-blue-400">Traitement audio en cours</span>
                  </li>
                )}
              </ul>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
