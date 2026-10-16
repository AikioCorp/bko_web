"use client";

import React, { useState, useRef } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  UploadCloud, 
  Save, 
  Radio, 
  Loader2, 
  Music, 
  CheckCircle,
  FileAudio
} from "lucide-react";

import { fetchApi } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const fetcher = (url: string) => fetchApi(url).then(res => {
  if (!res.success) throw new Error(res.message);
  return res.data;
});

export default function NewEpisodePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState("");
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [createdEpisodeId, setCreatedEpisodeId] = useState<string | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  
  // Form State
  const [podcastId, setPodcastId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [seasonNumber, setSeasonNumber] = useState<string>("");
  const [episodeNumber, setEpisodeNumber] = useState<string>("");
  const [mediaType, setMediaType] = useState<"AUDIO" | "VIDEO">("AUDIO");
  const [file, setFile] = useState<File | null>(null);

  // Fetch creator's podcasts
  const { data: podcastsData, isLoading: isLoadingPodcasts } = useSWR("/creator/podcasts", fetcher);
  const podcasts = Array.isArray(podcastsData) ? podcastsData : (podcastsData?.items || []);

  // Pre-select if there's only one podcast
  React.useEffect(() => {
    if (podcasts.length === 1 && !podcastId) {
      setPodcastId(podcasts[0].id);
    }
  }, [podcasts, podcastId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg("");
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const isVideo = selected.type.startsWith("video/") || /\.(mp4|mov|webm)$/i.test(selected.name);
      const detectedType = isVideo ? "VIDEO" : "AUDIO";
      const maxSize = detectedType === "VIDEO" ? 2048 * 1024 * 1024 : 250 * 1024 * 1024;
      if (selected.size <= 0) {
        setErrorMsg("Le fichier sélectionné est vide (0 octet).");
        return;
      }
      if (selected.size > maxSize) {
        setErrorMsg(
          detectedType === "VIDEO"
            ? "Le fichier vidéo dépasse la taille maximale autorisée de 2 Go."
            : "Le fichier audio dépasse la taille maximale autorisée de 250 Mo."
        );
        return;
      }
      setMediaType(detectedType);
      setFile(selected);
    }
  };

  const handleCancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setIsSubmitting(false);
    setUploadProgress(0);
    setUploadStatusText("");
    setErrorMsg("Téléversement annulé. Le brouillon est conservé, vous pouvez réessayer.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg("");

    if (!podcastId || !title.trim() || !description.trim() || !file) {
      setErrorMsg("Veuillez sélectionner une émission, renseigner un titre, une description et choisir un fichier média.");
      return;
    }

    const maxSize = mediaType === "VIDEO" ? 2048 * 1024 * 1024 : 250 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMsg(
        mediaType === "VIDEO"
          ? "Le fichier vidéo dépasse la limite autorisée de 2 Go."
          : "Le fichier audio dépasse la limite autorisée de 250 Mo."
      );
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    setUploadStatusText(
      createdEpisodeId
        ? "Mise à jour du brouillon existant..."
        : "1/4 Création du brouillon de l'épisode..."
    );
    try {
      let epId = createdEpisodeId;

      if (!epId) {
        const metaRes = await fetchApi(`/creator/podcasts/${podcastId}/episodes`, {
          method: "POST",
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            seasonNumber: seasonNumber ? parseInt(seasonNumber, 10) : undefined,
            episodeNumber: episodeNumber ? parseInt(episodeNumber, 10) : undefined,
            status: "DRAFT",
          }),
        });
        if (!metaRes.success || !metaRes.data?.id) {
          throw new Error(metaRes.message || "Impossible de créer le brouillon de l'épisode.");
        }
        epId = metaRes.data.id;
        setCreatedEpisodeId(epId);
      } else {
        const patchRes = await fetchApi(`/creator/episodes/${epId}`, {
          method: "PATCH",
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            seasonNumber: seasonNumber ? parseInt(seasonNumber, 10) : null,
            episodeNumber: episodeNumber ? parseInt(episodeNumber, 10) : null,
          }),
        });
        if (!patchRes.success) {
          throw new Error(patchRes.message || "Impossible de mettre à jour le brouillon.");
        }
      }

      // 2. Prepare native R2 presigned upload session
      const resolvedMime =
        file.type || (mediaType === "VIDEO" ? "video/mp4" : "audio/mpeg");
      setUploadStatusText("2/4 Préparation du téléversement sécurisé...");
      const sessionRes = await fetchApi("/creator/uploads", {
        method: "POST",
        body: JSON.stringify({
          originalFilename: file.name,
          mimeType: resolvedMime,
          sizeBytes: file.size,
          mediaType,
          episodeId: epId,
        }),
      });

      if (!sessionRes.success || !sessionRes.data?.uploadUrl) {
        throw new Error(sessionRes.message || "Échec d'initialisation de la session de téléversement.");
      }

      const { uploadSessionId, uploadUrl } = sessionRes.data;

      // 3. Upload file directly to S3/R2 storage with progress
      setUploadStatusText("3/4 Téléversement du fichier vers le stockage...");
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;
      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader("Content-Type", resolvedMime);
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      };

      await new Promise((resolve, reject) => {
        xhr.onload = () => {
          xhrRef.current = null;
          if (xhr.status >= 200 && xhr.status < 300) resolve(true);
          else reject(new Error(`Échec du téléversement vers le stockage (HTTP ${xhr.status}).`));
        };
        xhr.onabort = () => {
          xhrRef.current = null;
          reject(new Error("__ABORTED__"));
        };
        xhr.onerror = () => {
          xhrRef.current = null;
          reject(new Error("Erreur de connexion lors du téléversement."));
        };
        xhr.send(file);
      });

      // 4. Complete upload session to register MediaAsset and start background processing
      setUploadStatusText("4/4 Finalisation et indexation du média...");
      const completeRes = await fetchApi(`/creator/uploads/${uploadSessionId}/complete`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (!completeRes.success) {
        throw new Error(completeRes.message || "Échec de finalisation du téléversement.");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/studio/episodes/${epId}/edit?created=1`);
      }, 1500);
    } catch (error: any) {
      if (error?.message === "__ABORTED__") return;
      console.error(error);
      setErrorMsg(error.message || "Une erreur est survenue lors de l'enregistrement.");
      setIsSubmitting(false);
      setUploadProgress(0);
      setUploadStatusText("");
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-white">Brouillon et média enregistrés !</h1>
          <p className="text-[#888]">Votre fichier a été téléversé et est en cours de traitement. Redirection vers la fiche de l&apos;épisode...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 w-full">
      <div className="flex items-center gap-4 border-b border-[#222] pb-6">
        <Link href="/studio/episodes" className="text-[#888] hover:text-white transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Ajouter un épisode
          </h1>
          <p className="text-[#888888]">
            Renseignez les détails et téléversez votre fichier audio.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400">
          {errorMsg}
          {createdEpisodeId && (
            <p className="text-xs text-amber-400 mt-1">
              Le brouillon de l&apos;épisode a été conservé. Cliquez sur « Réessayer l&apos;envoi » pour relancer le transfert sans créer de doublon.
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-[#111] border-[#222] text-white shadow-xl">
          <CardHeader className="border-b border-[#222] pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Radio className="w-5 h-5 text-[#FFBF00]" />
              Informations générales
            </CardTitle>
            <CardDescription className="text-[#888]">
              Choisissez l'émission et décrivez l'épisode.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#CCC]">Podcast de destination *</label>
              {isLoadingPodcasts ? (
                <div className="h-10 bg-[#161616] rounded-md animate-pulse border border-[#333]" />
              ) : (
                <select 
                  className="flex h-10 w-full rounded-md border border-[#333] bg-[#0E0E0E] px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFBF00] disabled:cursor-not-allowed disabled:opacity-50"
                  value={podcastId}
                  onChange={(e) => setPodcastId(e.target.value)}
                  disabled={!!createdEpisodeId || isSubmitting}
                  required
                >
                  <option value="" disabled>Sélectionnez un podcast...</option>
                  {podcasts.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#CCC]">Titre de l'épisode *</label>
              <Input
                placeholder="Ex: Épisode 4 - Les origines"
                className="bg-[#0E0E0E] border-[#333] text-white focus-visible:ring-[#FFBF00]"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#CCC]">Description (Notes de l'émission) *</label>
              <textarea
                placeholder="Décrivez le contenu de l'épisode, les invités, les liens pertinents..."
                className="flex w-full rounded-md border border-[#333] bg-[#0E0E0E] px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFBF00] min-h-[120px] resize-y"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#CCC]">Numéro de Saison</label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Ex: 1"
                  className="bg-[#0E0E0E] border-[#333] text-white focus-visible:ring-[#FFBF00]"
                  value={seasonNumber}
                  onChange={(e) => setSeasonNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#CCC]">Numéro d'Épisode</label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Ex: 4"
                  className="bg-[#0E0E0E] border-[#333] text-white focus-visible:ring-[#FFBF00]"
                  value={episodeNumber}
                  onChange={(e) => setEpisodeNumber(e.target.value)}
                />
              </div>
            </div>

          </CardContent>
        </Card>

        <Card className="bg-[#111] border-[#222] text-white shadow-xl">
          <CardHeader className="border-b border-[#222] pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Music className="w-5 h-5 text-blue-400" />
              Fichier Média (Audio ou Vidéo)
            </CardTitle>
            <CardDescription className="text-[#888]">
              Formats supportés: Audio MP3, AAC, M4A, WAV (Max: 250 Mo) • Vidéo MP4, MOV, WebM (Max: 2 Go)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="relative group">
              <input 
                type="file" 
                accept=".mp3,.m4a,.aac,.wav,.ogg,.mp4,.mov,.webm,audio/*,video/*" 
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                disabled={isSubmitting}
                required={!file}
              />
              <div className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${file ? 'border-[#FFBF00] bg-[#FFBF00]/5' : 'border-[#333] bg-[#0E0E0E] group-hover:border-[#555] group-hover:bg-[#161616]'}`}>
                {file ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-[#FFBF00]/20 rounded-full flex items-center justify-center">
                      <FileAudio className="w-8 h-8 text-[#FFBF00]" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">{file.name}</p>
                      <p className="text-sm text-[#888]">{mediaType} • {(file.size / (1024 * 1024)).toFixed(2)} Mo</p>
                    </div>
                    <p className="text-xs text-[#666] mt-2">Cliquez ou glissez pour remplacer</p>

                    {isSubmitting && (
                      <div className="w-full max-w-md mt-4 space-y-2 z-20 relative">
                        <div className="flex justify-between text-xs text-[#AAA]">
                          <span>{uploadStatusText}</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="h-2 w-full bg-[#222] rounded-full overflow-hidden">
                          <div className="h-full bg-[#FFBF00] transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-[#222] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-8 h-8 text-[#888]" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-white">Glissez votre fichier audio ou vidéo ici</p>
                      <p className="text-sm text-[#888]">ou cliquez pour parcourir vos dossiers</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pt-4 border-t border-[#222]">
          {isSubmitting ? (
            <Button type="button" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={handleCancelUpload}>
              Interrompre le transfert
            </Button>
          ) : (
            <Button type="button" variant="ghost" className="text-[#888] hover:text-white hover:bg-[#222]" onClick={() => router.back()}>
              Annuler
            </Button>
          )}
          <Button 
            type="submit" 
            className="bg-[#FFBF00] hover:bg-[#E5A800] text-[#0B0B0B] font-bold px-8 h-12 text-lg"
            disabled={isSubmitting || !podcastId || !file || !title.trim() || !description.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Téléversement ({uploadProgress}%)...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                {createdEpisodeId ? "Réessayer l'envoi" : "Enregistrer l'épisode"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
