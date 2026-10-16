"use client";
import { getAccessToken } from "@/lib/token";
import { API_BASE_URL } from "@/lib/api";

import React, { useRef, useState } from "react";
import { UploadCloud, CheckCircle, AlertCircle, Loader2, XCircle, RotateCcw } from "lucide-react";

interface MediaDropzoneProps {
  mediaType: "AUDIO" | "VIDEO";
  episodeId?: string;
  onUploadSuccess: (mediaAssetId: string) => void;
}

const ALLOWED_AUDIO_MIMES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
  "audio/aac",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/webm",
];

const ALLOWED_VIDEO_MIMES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

export const MediaDropzone: React.FC<MediaDropzoneProps> = ({ mediaType, episodeId, onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<"IDLE" | "VALIDATING" | "UPLOADING" | "PROCESSING" | "SUCCESS" | "CANCELLED" | "ERROR">("IDLE");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const pollAbortRef = useRef<boolean>(false);

  const validateSelectedFile = (selectedFile: File): string | null => {
    if (selectedFile.size <= 0) {
      return "Le fichier sélectionné est vide (0 octet).";
    }
    const maxBytes = mediaType === "AUDIO" ? 250 * 1024 * 1024 : 2048 * 1024 * 1024;
    if (selectedFile.size > maxBytes) {
      return mediaType === "AUDIO"
        ? "Le fichier audio dépasse la taille maximale autorisée de 250 Mo."
        : "Le fichier vidéo dépasse la taille maximale autorisée de 2 Go.";
    }
    const rawMime = (selectedFile.type || "").toLowerCase();
    const ext = selectedFile.name.split(".").pop()?.toLowerCase() || "";
    if (mediaType === "AUDIO") {
      const validExt = ["mp3", "m4a", "aac", "wav", "ogg", "webm"].includes(ext);
      if (rawMime && !ALLOWED_AUDIO_MIMES.includes(rawMime) && !validExt) {
        return `Format audio non supporté (${rawMime || ext}). Utilisez MP3, M4A, AAC, WAV ou OGG.`;
      }
    } else {
      const validExt = ["mp4", "mov", "webm"].includes(ext);
      if (rawMime && !ALLOWED_VIDEO_MIMES.includes(rawMime) && !validExt) {
        return `Format vidéo non supporté (${rawMime || ext}). Utilisez MP4, MOV ou WebM.`;
      }
    }
    return null;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    await startUpload(selectedFile);
  };

  const cancelUpload = () => {
    pollAbortRef.current = true;
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setStatus("CANCELLED");
    setErrorMsg("Téléversement annulé.");
  };

  const startUpload = async (selectedFile: File) => {
    if (status === "UPLOADING" || status === "PROCESSING") return;
    pollAbortRef.current = false;
    setStatus("VALIDATING");
    setProgress(0);
    setErrorMsg("");

    const validationError = validateSelectedFile(selectedFile);
    if (validationError) {
      setErrorMsg(validationError);
      setStatus("ERROR");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setErrorMsg("Veuillez vous connecter pour téléverser un fichier.");
      setStatus("ERROR");
      return;
    }

    try {
      const resolvedMime =
        selectedFile.type || (mediaType === "AUDIO" ? "audio/mpeg" : "video/mp4");

      // 1. Demande de session d'upload au backend Express
      const sessionRes = await fetch(`${API_BASE_URL}/creator/uploads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          originalFilename: selectedFile.name,
          mimeType: resolvedMime,
          sizeBytes: selectedFile.size,
          mediaType,
          episodeId,
        }),
      });

      const sessionJson = await sessionRes.json();
      if (!sessionRes.ok || !sessionJson.success) {
        setErrorMsg(sessionJson.error?.message || "Échec de création de la session de téléversement.");
        setStatus("ERROR");
        return;
      }

      const { uploadSessionId, uploadUrl } = sessionJson.data;

      // 2. Upload direct vers le stockage avec progression mesurable et annulation
      setStatus("UPLOADING");
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;
        xhr.open("PUT", uploadUrl, true);
        xhr.setRequestHeader("Content-Type", resolvedMime);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setProgress(percent);
          }
        };

        xhr.onload = () => {
          xhrRef.current = null;
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Le stockage a refusé le fichier (HTTP ${xhr.status}).`));
          }
        };

        xhr.onabort = () => {
          xhrRef.current = null;
          reject(new Error("__ABORTED__"));
        };

        xhr.onerror = () => {
          xhrRef.current = null;
          reject(new Error("Erreur réseau pendant le transfert du fichier."));
        };
        xhr.send(selectedFile);
      });

      // 3. Notification de fin d'upload au backend Express
      setStatus("PROCESSING");
      const completeRes = await fetch(`${API_BASE_URL}/creator/uploads/${uploadSessionId}/complete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const completeJson = await completeRes.json();
      if (!completeRes.ok || !completeJson.success) {
        setErrorMsg(completeJson.error?.message || "Erreur lors de la validation du fichier sur le serveur.");
        setStatus("ERROR");
        return;
      }

      const mediaAssetId = completeJson.data.mediaAssetId;

      // 4. Suivi du traitement réel côté serveur (PROCESSING -> READY / FAILED)
      for (let attempt = 0; attempt < 15; attempt++) {
        if (pollAbortRef.current) return;
        try {
          const statusRes = await fetch(`${API_BASE_URL}/creator/uploads/${uploadSessionId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const statusJson = await statusRes.json();
          const assetStatus = statusJson?.data?.mediaAsset?.status;
          if (assetStatus === "READY") {
            setStatus("SUCCESS");
            onUploadSuccess(mediaAssetId);
            return;
          }
          if (assetStatus === "FAILED") {
            setErrorMsg(
              statusJson?.data?.mediaAsset?.errorReason ||
                "Le traitement du média a échoué (fichier corrompu ou format invalide)."
            );
            setStatus("ERROR");
            return;
          }
        } catch {
          // Continue polling
        }
        await new Promise((r) => setTimeout(r, 2000));
      }

      // Si le traitement se poursuit en arrière-plan, on informe la page parente qui continue de suivre l'état
      setStatus("SUCCESS");
      onUploadSuccess(mediaAssetId);
    } catch (err: any) {
      if (err?.message === "__ABORTED__") {
        setStatus("CANCELLED");
        setErrorMsg("Téléversement annulé.");
        return;
      }
      setErrorMsg(err.message || "Erreur lors du transfert du fichier.");
      setStatus("ERROR");
    }
  };

  return (
    <div className="bg-[#0A0D14] border border-[#1E2638] rounded-xl p-6 text-center space-y-4">
      <input
        type="file"
        id={`dropzone-${mediaType}`}
        accept={mediaType === "AUDIO" ? ".mp3,.m4a,.aac,.wav,.ogg,audio/*" : ".mp4,.mov,.webm,video/*"}
        onChange={handleFileChange}
        disabled={status === "UPLOADING" || status === "PROCESSING"}
        className="hidden"
      />

      <label
        htmlFor={`dropzone-${mediaType}`}
        className={`flex flex-col items-center justify-center space-y-2 p-6 border-2 border-dashed border-[#1E2638] rounded-xl transition ${
          status === "UPLOADING" || status === "PROCESSING"
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer hover:border-[#E5A93C]"
        }`}
      >
        <UploadCloud className="w-10 h-10 text-[#E5A93C]" />
        <span className="font-bold text-white text-xs">
          {file
            ? `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} Mo)`
            : `Sélectionnez votre fichier ${mediaType === "AUDIO" ? "Audio (MP3, WAV, M4A)" : "Vidéo (MP4, MOV, WebM)"}`}
        </span>
        <span className="text-[10px] text-gray-400">
          Max : {mediaType === "AUDIO" ? "250 Mo" : "2 Go"} • Étapes : Sélection → Validation → Transfert → Traitement → Prêt
        </span>
      </label>

      {status === "VALIDATING" && (
        <div className="flex items-center justify-center space-x-2 text-xs text-gray-300 font-bold">
          <Loader2 className="w-4 h-4 animate-spin text-[#E5A93C]" />
          <span>1/4 Validation du format et de la taille...</span>
        </div>
      )}

      {status === "UPLOADING" && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs text-gray-300">
            <span>2/4 Transfert vers le stockage en cours...</span>
            <div className="flex items-center gap-3">
              <span className="font-bold text-[#E5A93C]">{progress}%</span>
              <button
                type="button"
                onClick={cancelUpload}
                className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Annuler</span>
              </button>
            </div>
          </div>
          <div className="w-full h-2 bg-[#1E2638] rounded-full overflow-hidden">
            <div className="h-full bg-[#E5A93C] transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {status === "PROCESSING" && (
        <div className="space-y-2">
          <div className="flex items-center justify-center space-x-2 text-xs text-[#E5A93C] font-bold">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>3/4 Traitement et vérification du média sur le serveur...</span>
          </div>
          <div className="w-full h-1.5 bg-[#1E2638] rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-[#E5A93C] animate-pulse rounded-full" />
          </div>
        </div>
      )}

      {status === "SUCCESS" && (
        <div className="flex items-center justify-center space-x-2 text-xs text-green-400 font-bold bg-green-500/10 p-3 rounded-lg border border-green-500/20">
          <CheckCircle className="w-4 h-4" />
          <span>4/4 Média transféré et enregistré sur l&apos;épisode.</span>
        </div>
      )}

      {(status === "ERROR" || status === "CANCELLED") && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-red-400 font-bold bg-red-500/10 p-3 rounded-lg border border-red-500/20">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          {file && (
            <button
              type="button"
              onClick={() => startUpload(file)}
              className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-white flex items-center gap-1.5 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réessayer</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
