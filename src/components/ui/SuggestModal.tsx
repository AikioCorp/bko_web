"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, Radio, AlertCircle, ExternalLink, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

interface SuggestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuggestModal({ isOpen, onClose }: SuggestModalProps) {
  const { user, isAuthenticated } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [suggestionId, setSuggestionId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [details, setDetails] = useState("");

  useEffect(() => {
    if (isOpen) {
      setErrorMessage("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("Veuillez indiquer le nom de l'émission ou du créateur.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetchApi("/discovery/suggestions", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          sourceUrl: link.trim() || undefined,
          details: details.trim() || undefined,
        }),
      });

      if (!res.success) {
        throw new Error(res.error?.message || res.message || "Impossible d'enregistrer votre proposition.");
      }

      setSuggestionId(res.data?.id || null);
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || "Une erreur est survenue lors de l'envoi de votre suggestion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setErrorMessage("");
    setName("");
    setLink("");
    setDetails("");
    setSuggestionId(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && handleReset()}>
      <DialogContent className="sm:max-w-md bg-[#111111] border border-[#262626] text-white p-0 overflow-hidden rounded-2xl shadow-2xl">
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">Merci pour votre suggestion !</h2>
              <p className="text-xs text-[#8E8E8E] max-w-sm mx-auto leading-relaxed">
                Votre proposition concernant <span className="text-white font-medium">« {name} »</span> a été transmise à notre équipe éditoriale pour analyse et ajout au catalogue.
              </p>
            </div>

            {suggestionId && (
              <div className="px-3 py-1.5 rounded-lg bg-[#181818] border border-[#262626] text-[11px] font-mono text-[#888]">
                ID : {suggestionId}
              </div>
            )}

            <div className="pt-2 flex items-center gap-2">
              <Button
                type="button"
                onClick={() => {
                  setIsSuccess(false);
                  setName("");
                  setLink("");
                  setDetails("");
                }}
                variant="outline"
                className="bg-transparent border-[#333] hover:bg-[#1C1C1C] text-xs font-semibold text-white h-9 px-4 rounded-xl"
              >
                Proposer un autre contenu
              </Button>
              <Button
                type="button"
                onClick={handleReset}
                className="bg-[#FFBF00] hover:bg-[#e6ac00] text-black font-bold text-xs h-9 px-5 rounded-xl"
              >
                Fermer
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-6 pb-0">
              <DialogHeader>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-9 h-9 bg-[#FFBF00]/10 rounded-xl flex items-center justify-center border border-[#FFBF00]/20 text-[#FFBF00]">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-bold text-white">Proposer une émission</DialogTitle>
                    <DialogDescription className="text-xs text-[#8E8E8E] text-left pt-0.5">
                      Une voix vous manque sur Bamako Podcast ? Faites-la nous découvrir.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {isAuthenticated && user && (
                <div className="mt-3 px-3 py-2 rounded-xl bg-[#181818] border border-[#262626] flex items-center justify-between text-xs text-[#8E8E8E]">
                  <span>Connecté en tant que <strong className="text-white font-medium">{user.fullName || user.email}</strong></span>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="suggest-name" className="text-xs font-semibold text-[#CCC]">
                  Nom du créateur, de la radio ou du podcast <span className="text-[#FFBF00]">*</span>
                </label>
                <Input
                  id="suggest-name"
                  required
                  placeholder="Ex: Radio Kledu, Amadou Hampâté Bâ, Les Décodeurs..."
                  className="bg-[#161616] border-[#2E2E2E] text-white text-xs h-10 focus-visible:ring-1 focus-visible:ring-[#FFBF00]"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="suggest-link" className="text-xs font-semibold text-[#CCC]">
                  Lien ou source <span className="text-[#666] font-normal">(Optionnel)</span>
                </label>
                <Input
                  id="suggest-link"
                  type="url"
                  placeholder="Lien YouTube, Facebook, flux RSS, site web..."
                  className="bg-[#161616] border-[#2E2E2E] text-white text-xs h-10 focus-visible:ring-1 focus-visible:ring-[#FFBF00]"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="suggest-details" className="text-xs font-semibold text-[#CCC]">
                  Précisions <span className="text-[#666] font-normal">(Optionnel)</span>
                </label>
                <textarea
                  id="suggest-details"
                  rows={3}
                  placeholder="Dites-nous ce qui vous plaît particulièrement dans ce contenu..."
                  className="flex w-full rounded-xl border border-[#2E2E2E] bg-[#161616] px-3 py-2 text-xs text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FFBF00] resize-none"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-xs text-[#888] hover:text-white hover:bg-[#202020] h-10 px-4 rounded-xl"
                  onClick={onClose}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={!name.trim() || isSubmitting}
                  className="bg-[#FFBF00] hover:bg-[#e6ac00] text-black font-bold text-xs h-10 px-5 rounded-xl disabled:opacity-50"
                >
                  {isSubmitting ? "Envoi en cours..." : "Envoyer ma proposition"}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
