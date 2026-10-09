"use client";

import React, { useState } from "react";
import { X, CheckCircle, Radio } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SuggestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuggestModal({ isOpen, onClose }: SuggestModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [details, setDetails] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setIsSubmitting(true);
    
    // Simulate API call for now
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitting(false);
    setIsSuccess(true);
    
    // Reset form after a delay and close
    setTimeout(() => {
      setIsSuccess(false);
      setName("");
      setLink("");
      setDetails("");
      onClose();
    }, 3000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-[#111] border-[#222] text-white p-0 overflow-hidden rounded-2xl">
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center p-10 text-center space-y-4">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-2">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white">Merci pour votre suggestion !</h2>
            <p className="text-[#888]">
              Notre Ã©quipe Ã©ditoriale va Ã©tudier votre proposition pour ajouter cette voix au catalogue.
            </p>
          </div>
        ) : (
          <>
            <div className="p-6 pb-0">
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-[#FFBF00]/10 rounded-full flex items-center justify-center border border-[#FFBF00]/20">
                    <Radio className="w-5 h-5 text-[#FFBF00]" />
                  </div>
                  <DialogTitle className="text-xl font-bold">Proposer une Ã©mission</DialogTitle>
                </div>
                <DialogDescription className="text-[#888] text-left pt-2">
                  Une voix vous manque sur Bamako Podcast ? Dites-le nous et nous ferons notre possible pour l'ajouter Ã  la plateforme.
                </DialogDescription>
              </DialogHeader>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#CCC]">Nom du crÃ©ateur, de la radio ou du podcast *</label>
                <Input
                  required
                  placeholder="Ex: Radio Kledu, Amadou HampÃ¢tÃ© BÃ¢..."
                  className="bg-[#0E0E0E] border-[#333] text-white focus-visible:ring-[#FFBF00]"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#CCC]">Lien ou source (Optionnel)</label>
                <Input
                  placeholder="Lien YouTube, Facebook, page web..."
                  className="bg-[#0E0E0E] border-[#333] text-white focus-visible:ring-[#FFBF00]"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#CCC]">PrÃ©cisions (Optionnel)</label>
                <textarea
                  placeholder="Dites-nous pourquoi vous aimez ce crÃ©ateur..."
                  className="flex w-full rounded-md border border-[#333] bg-[#0E0E0E] px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FFBF00] min-h-[80px] resize-none"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="text-[#888] hover:text-white hover:bg-[#222]" 
                  onClick={onClose}
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={!name || isSubmitting}
                  className="bg-[#FFBF00] hover:bg-[#E5A800] text-[#0B0B0B] font-bold px-6"
                >
                  {isSubmitting ? "Envoi..." : "Envoyer la suggestion"}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

