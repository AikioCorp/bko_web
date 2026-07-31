"use client";
import { API_BASE_URL } from "@/lib/api";

import React, { useState } from "react";
import { UploadCloud, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface MediaDropzoneProps {
  mediaType: "AUDIO" | "VIDEO";
  episodeId?: string;
  onUploadSuccess: (mediaAssetId: string) => void;
}

export const MediaDropzone: React.FC<MediaDropzoneProps> = ({ mediaType, episodeId, onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<"IDLE" | "UPLOADING" | "PROCESSING" | "SUCCESS" | "ERROR">("IDLE");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    await startUpload(selectedFile);
  };

  const startUpload = async (selectedFile: File) => {
    setStatus("UPLOADING");
    setProgress(0);
    setErrorMsg("");

    const token = localStorage.getItem("bko_access_token");
    if (!token) {
      setErrorMsg("Veuillez vous connecter pour uploader un fichier.");
      setStatus("ERROR");
      return;
    }

    try {
      // 1. Demande de session d'upload au backend Express
      const sessionRes = await fetch("${API_BASE_URL}/creator/uploads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          originalFilename: selectedFile.name,
          mimeType: selectedFile.type || (mediaType === "AUDIO" ? "audio/mpeg" : "video/mp4"),
          sizeBytes: selectedFile.size,
          mediaType,
          episodeId,
        }),
      });

      const sessionJson = await sessionRes.json();
      if (!sessionJson.success) {
        setErrorMsg(sessionJson.error?.message || "Échec de création de la session d'upload");
        setStatus("ERROR");
        return;
      }

      const { uploadSessionId, uploadUrl } = sessionJson.data;

      // 2. Upload direct vers R2 via XMLHttpRequest pour suivre le pourcentage de progression
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl, true);
        xhr.setRequestHeader("Content-Type", selectedFile.type || "application/octet-stream");

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Erreur HTTP R2: ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Erreur réseau pendant l'upload direct"));
        xhr.send(selectedFile);
      });

      // 3. Notification de fin d'upload au backend Express
      setStatus("PROCESSING");
      const completeRes = await fetch(`${API_BASE_URL}/creator/uploads/${uploadSessionId}/complete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const completeJson = await completeRes.json();
      if (completeJson.success) {
        setStatus("SUCCESS");
        onUploadSuccess(completeJson.data.mediaAssetId);
      } else {
        setErrorMsg(completeJson.error?.message || "Erreur de validation de l'upload");
        setStatus("ERROR");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors du transfert du fichier.");
      setStatus("ERROR");
    }
  };

  return (
    <div className="bg-[#0A0D14] border border-[#1E2638] rounded-xl p-6 text-center space-y-4">
      <input
        type="file"
        id={`dropzone-${mediaType}`}
        accept={mediaType === "AUDIO" ? "audio/*" : "video/*"}
        onChange={handleFileChange}
        className="hidden"
      />

      <label
        htmlFor={`dropzone-${mediaType}`}
        className="cursor-pointer flex flex-col items-center justify-center space-y-2 p-6 border-2 border-dashed border-[#1E2638] hover:border-[#E5A93C] rounded-xl transition"
      >
        <UploadCloud className="w-10 h-10 text-[#E5A93C]" />
        <span className="font-bold text-white text-xs">
          Glissez-déposez votre fichier {mediaType === "AUDIO" ? "Audio (MP3, WAV, M4A)" : "Vidéo (MP4)"}
        </span>
        <span className="text-[10px] text-gray-400">
          Max : {mediaType === "AUDIO" ? "250 Mo" : "2 Go"} • Transfert direct sécurisé R2
        </span>
      </label>

      {/* Barre de Progression & Statuts */}
      {status === "UPLOADING" && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-300">
            <span>Transfert direct en cours...</span>
            <span className="font-bold text-[#E5A93C]">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-[#1E2638] rounded-full overflow-hidden">
            <div className="h-full bg-[#E5A93C] transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {status === "PROCESSING" && (
        <div className="flex items-center justify-center space-x-2 text-xs text-[#E5A93C] font-bold">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Vérification et analyse FFprobe en cours...</span>
        </div>
      )}

      {status === "SUCCESS" && (
        <div className="flex items-center justify-center space-x-2 text-xs text-green-400 font-bold bg-green-500/10 p-3 rounded-lg border border-green-500/20">
          <CheckCircle className="w-4 h-4" />
          <span>Fichier uploadé et rattaché avec succès !</span>
        </div>
      )}

      {status === "ERROR" && (
        <div className="flex items-center justify-center space-x-2 text-xs text-red-400 font-bold bg-red-500/10 p-3 rounded-lg border border-red-500/20">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
