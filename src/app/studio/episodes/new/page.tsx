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
  
  // Form State
  const [podcastId, setPodcastId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [seasonNumber, setSeasonNumber] = useState<string>("");
  const [episodeNumber, setEpisodeNumber] = useState<string>("");
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
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 250 * 1024 * 1024) {
        alert("Le fichier audio dÃ©passe la taille maximale autorisÃ©e de 250 Mo.");
        return;
      }
      setFile(selected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!podcastId || !title.trim() || !file) {
      alert("Veuillez sÃ©lectionner un podcast, renseigner un titre et choisir un fichier audio.");
      return;
    }

    if (file.size > 250 * 1024 * 1024) {
      alert("Le fichier audio dÃ©passe la limite autorisÃ©e de 250 Mo.");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    setUploadStatusText("CrÃ©ation du brouillon de l'Ã©pisode...");
    try {
      // 1. Create episode draft
      const metaRes = await fetchApi(`/creator/podcasts/${podcastId}/episodes`, {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          seasonNumber: seasonNumber ? parseInt(seasonNumber) : undefined,
          episodeNumber: episodeNumber ? parseInt(episodeNumber) : undefined,
          status: "DRAFT"
        })
      });
      
      const newEpisode = metaRes.data;

      // 2. Prepare native R2 presigned upload session
      setUploadStatusText("PrÃ©paration du tÃ©lÃ©versement sÃ©curisÃ©...");
      const sessionRes = await fetchApi("/creator/uploads", {
        method: "POST",
        body: JSON.stringify({
          originalFilename: file.name,
          mimeType: file.type || "audio/mpeg",
          sizeBytes: file.size,
          mediaType: "AUDIO",
          episodeId: newEpisode.id
        })
      });

      const { uploadSessionId, uploadUrl } = sessionRes.data;

      // 3. Upload file directly to S3/R2 storage with progress
      setUploadStatusText("TÃ©lÃ©versement du fichier audio en cours...");
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader("Content-Type", file.type || "audio/mpeg");
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      };

      await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve(true);
          else reject(new Error("Ã‰chec du tÃ©lÃ©versement vers le stockage"));
        };
        xhr.onerror = () => reject(new Error("Erreur de connexion lors du tÃ©lÃ©versement"));
        xhr.send(file);
      });

      // 4. Complete upload session to register MediaAsset and start background processing
      setUploadStatusText("Finalisation et indexation...");
      await fetchApi(`/creator/uploads/${uploadSessionId}/complete`, {
        method: "POST",
        body: JSON.stringify({})
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/studio/episodes");
      }, 2000);

    } catch (error: any) {
      console.error(error);
      alert(error.message || "Une erreur est survenue lors de la crÃ©ation.");
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
          <h1 className="text-3xl font-extrabold text-white">Ã‰pisode enregistrÃ© !</h1>
          <p className="text-[#888]">Votre fichier audio a Ã©tÃ© tÃ©lÃ©versÃ© avec succÃ¨s. Redirection vers vos Ã©pisodes...</p>
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
            Ajouter un Ã©pisode
          </h1>
          <p className="text-[#888888]">
            Renseignez les dÃ©tails et tÃ©lÃ©versez votre fichier audio.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-[#111] border-[#222] text-white shadow-xl">
          <CardHeader className="border-b border-[#222] pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Radio className="w-5 h-5 text-[#FFBF00]" />
              Informations gÃ©nÃ©rales
            </CardTitle>
            <CardDescription className="text-[#888]">
              Choisissez l'Ã©mission et dÃ©crivez l'Ã©pisode.
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
                  required
                >
                  <option value="" disabled>SÃ©lectionnez un podcast...</option>
                  {podcasts.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#CCC]">Titre de l'Ã©pisode *</label>
              <Input
                placeholder="Ex: Ã‰pisode 4 - Les origines"
                className="bg-[#0E0E0E] border-[#333] text-white focus-visible:ring-[#FFBF00]"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#CCC]">Description (Notes de l'Ã©mission)</label>
              <textarea
                placeholder="DÃ©crivez le contenu de l'Ã©pisode, les invitÃ©s, les liens pertinents..."
                className="flex w-full rounded-md border border-[#333] bg-[#0E0E0E] px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFBF00] min-h-[120px] resize-y"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#CCC]">NumÃ©ro de Saison</label>
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
                <label className="text-sm font-medium text-[#CCC]">NumÃ©ro d'Ã‰pisode</label>
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
              Fichier Audio
            </CardTitle>
            <CardDescription className="text-[#888]">
              Formats supportÃ©s: MP3, AAC, WAV (Max: 250 Mo)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="relative group">
              <input 
                type="file" 
                accept="audio/*" 
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                disabled={isSubmitting}
                required
              />
              <div className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${file ? 'border-[#FFBF00] bg-[#FFBF00]/5' : 'border-[#333] bg-[#0E0E0E] group-hover:border-[#555] group-hover:bg-[#161616]'}`}>
                {file ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-[#FFBF00]/20 rounded-full flex items-center justify-center">
                      <FileAudio className="w-8 h-8 text-[#FFBF00]" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">{file.name}</p>
                      <p className="text-sm text-[#888]">{(file.size / (1024 * 1024)).toFixed(2)} Mo</p>
                    </div>
                    <p className="text-xs text-[#666] mt-2">Cliquez ou glissez pour remplacer</p>

                    {isSubmitting && (
                      <div className="w-full max-w-md mt-4 space-y-2">
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
                      <p className="text-lg font-medium text-white">Glissez votre fichier ici</p>
                      <p className="text-sm text-[#888]">ou cliquez pour parcourir vos dossiers</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pt-4 border-t border-[#222]">
          <Button type="button" variant="ghost" className="text-[#888] hover:text-white hover:bg-[#222]" onClick={() => router.back()} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button 
            type="submit" 
            className="bg-[#FFBF00] hover:bg-[#E5A800] text-[#0B0B0B] font-bold px-8 h-12 text-lg"
            disabled={isSubmitting || !podcastId || !file || !title}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                TÃ©lÃ©versement ({uploadProgress}%)...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Enregistrer l'Ã©pisode
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

