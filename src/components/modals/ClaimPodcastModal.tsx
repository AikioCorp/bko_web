"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  Loader2, 
  FileText, 
  Globe, 
  AtSign, 
  FileUp, 
  AlertCircle,
  HelpCircle,
  Lock
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";

interface ClaimPodcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  podcastId: string;
  podcastName: string;
  podcastCover?: string;
}

export function ClaimPodcastModal({
  isOpen,
  onClose,
  podcastId,
  podcastName,
  podcastCover,
}: ClaimPodcastModalProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [method, setMethod] = useState<"EMAIL_DOMAIN" | "WEBSITE" | "DOCUMENT" | "MANUAL">("EMAIL_DOMAIN");
  const [proofDescription, setProofDescription] = useState("");
  const [proofDocumentUrl, setProofDocumentUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (!proofDescription.trim()) {
      setErrorMsg("Veuillez fournir une explication ou preuve de votre légitimité.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      await fetchApi(`/podcasts/${podcastId}/claims`, {
        method: "POST",
        body: JSON.stringify({
          verificationMethod: method,
          proofDescription: proofDescription.trim(),
          proofDocumentUrl: proofDocumentUrl.trim() || undefined,
        }),
      });
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Impossible de soumettre votre demande.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay sombre solide */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Boîte Modale */}
      <div className="relative w-full max-w-lg bg-[#141414] border border-[#262626] rounded-2xl shadow-2xl p-6 z-10 text-white animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-lg bg-[#222222] text-[#888888] hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {isSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Demande transmise avec succès</h3>
              <p className="text-xs text-[#A0A0A0] max-w-sm mx-auto leading-relaxed">
                Votre demande de revendication pour l&apos;émission <strong className="text-white">{podcastName}</strong> a été enregistrée. L&apos;équipe éditoriale va vérifier vos justificatifs sous 24 à 48h.
              </p>
            </div>
            <div className="pt-2">
              <Button
                onClick={onClose}
                className="bg-[#FFBF00] hover:bg-[#E5AC00] text-[#0B0B0B] font-bold text-xs px-6"
              >
                Compris, fermer
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3 pr-8">
              <div className="w-12 h-12 rounded-xl bg-[#222222] border border-[#333333] flex items-center justify-center text-[#FFBF00] shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white leading-snug">Revendiquer cette émission</h3>
                <p className="text-xs text-[#888888]">
                  Vous êtes l&apos;auteur ou le producteur officiel de ce podcast ?
                </p>
              </div>
            </div>

            {/* Podcast Card */}
            <div className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl p-3 flex items-center gap-3">
              {podcastCover ? (
                <img src={podcastCover} alt={podcastName} className="w-12 h-12 rounded-lg object-cover bg-[#222]" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-[#222] flex items-center justify-center text-[#666] font-bold">
                  BKO
                </div>
              )}
              <div className="min-w-0">
                <div className="text-xs text-[#FFBF00] font-bold uppercase tracking-wider">Podcast ciblé</div>
                <div className="text-sm font-bold text-white truncate">{podcastName}</div>
              </div>
            </div>

            {/* Méthode de vérification */}
            <div>
              <label className="block text-xs font-semibold text-[#CCCCCC] uppercase tracking-wider mb-2">
                Méthode de vérification
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setMethod("EMAIL_DOMAIN")}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-colors ${
                    method === "EMAIL_DOMAIN"
                      ? "bg-[#222222] border-[#FFBF00] text-white"
                      : "bg-[#161616] border-[#262626] text-[#888888] hover:text-white"
                  }`}
                >
                  <AtSign className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="font-medium truncate">Email du domaine</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod("WEBSITE")}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-colors ${
                    method === "WEBSITE"
                      ? "bg-[#222222] border-[#FFBF00] text-white"
                      : "bg-[#161616] border-[#262626] text-[#888888] hover:text-white"
                  }`}
                >
                  <Globe className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="font-medium truncate">Site officiel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod("DOCUMENT")}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-colors ${
                    method === "DOCUMENT"
                      ? "bg-[#222222] border-[#FFBF00] text-white"
                      : "bg-[#161616] border-[#262626] text-[#888888] hover:text-white"
                  }`}
                >
                  <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-medium truncate">Pièce justificative</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod("MANUAL")}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-colors ${
                    method === "MANUAL"
                      ? "bg-[#222222] border-[#FFBF00] text-white"
                      : "bg-[#161616] border-[#262626] text-[#888888] hover:text-white"
                  }`}
                >
                  <FileUp className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-medium truncate">Explication manuelle</span>
                </button>
              </div>
            </div>

            {/* Champs du formulaire */}
            <div>
              <label className="block text-xs font-semibold text-[#CCCCCC] uppercase tracking-wider mb-1.5">
                Preuves et justification *
              </label>
              <textarea
                required
                rows={3}
                value={proofDescription}
                onChange={(e) => setProofDescription(e.target.value)}
                placeholder="Indiquez votre rôle, l'adresse de contact officielle, liens vers vos réseaux vérifiés ou contrat de production..."
                className="w-full p-3 bg-[#0E0E0E] border border-[#2A2A2A] rounded-xl text-xs text-white placeholder-[#666] focus:outline-none focus:border-[#FFBF00] resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#CCCCCC] uppercase tracking-wider mb-1.5">
                Lien vers un document ou site justificatif (optionnel)
              </label>
              <input
                type="url"
                value={proofDocumentUrl}
                onChange={(e) => setProofDocumentUrl(e.target.value)}
                placeholder="https://mon-podcast.com/mentions-legales ou lien cloud sécurisé"
                className="w-full h-10 px-3 bg-[#0E0E0E] border border-[#2A2A2A] rounded-xl text-xs text-white placeholder-[#666] focus:outline-none focus:border-[#FFBF00]"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-950/40 border border-red-800 text-red-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {!isAuthenticated && (
              <div className="p-3 bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs rounded-xl flex items-center gap-2">
                <Lock className="w-4 h-4 shrink-0" />
                <span>Vous devez être connecté avec un compte Bamako Podcast pour envoyer cette demande.</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#222222]">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-[#2A2A2A] bg-[#1A1A1A] text-[#CCCCCC] hover:text-white"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[#FFBF00] hover:bg-[#E5AC00] text-[#0B0B0B] font-bold text-xs"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  "Soumettre la revendication"
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
