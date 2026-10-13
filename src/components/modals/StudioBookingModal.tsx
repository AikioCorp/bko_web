"use client";

import React, { useState } from "react";
import { X, Mic, Send, CheckCircle2, AlertCircle, Phone, Mail, Calendar, MessageSquare } from "lucide-react";
import { fetchApi } from "@/lib/api";

interface StudioBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedService?: string;
}

export function StudioBookingModal({ isOpen, onClose, preselectedService }: StudioBookingModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [service, setService] = useState(preselectedService || "Forfait Professionnel (150 000 FCFA)");
  const [preferredDate, setPreferredDate] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const messageContent = `[DEMANDE DE RÉSERVATION STUDIO]\nFormule: ${service}\nDate souhaitée: ${preferredDate || "Non précisée"}\nPrécisions: ${notes || "Aucune"}`;
      
      const res = await fetchApi("/advertiser-inquiries", {
        method: "POST",
        body: JSON.stringify({
          company: "Réservation Studio",
          contactName: name,
          email,
          phone: phone || undefined,
          targetPeriod: preferredDate || undefined,
          budget: service,
          message: messageContent,
        }),
      });

      if (!res.success) {
        throw new Error(res.error?.message || "Échec lors de l'enregistrement de votre demande.");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setSuccess(false);
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-[#141414] border border-[#262626] rounded-3xl p-6 sm:p-8 text-white shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#1F1F1F] text-[#FFBF00]">
                <Mic className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-headline font-black text-white">
                Réserver le Studio Bamako Podcast
              </h2>
            </div>
            <p className="text-xs text-[#8E8E8E] leading-relaxed">
              Enregistrez vos épisodes dans notre studio physique professionnel avec matériel broadcast.
            </p>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-full text-[#888888] hover:text-white hover:bg-[#222222] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-4 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-[#FFBF00]/10 border border-[#FFBF00]/30 text-[#FFBF00] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-white">Demande enregistrée avec succès !</h3>
              <p className="text-xs text-[#A0A0A0] max-w-sm mx-auto leading-relaxed">
                Notre équipe de production vous contactera par WhatsApp ou par email dans les plus brefs délais pour confirmer votre créneau.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={handleResetAndClose}
                className="px-6 py-2.5 rounded-xl bg-[#FFBF00] hover:bg-[#e6ac00] text-[#0B0B0B] font-bold text-xs transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#D0D0D0]">Formule / Service souhaité *</label>
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                required
                className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#FFBF00] transition-colors"
              >
                <option value="Forfait Professionnel (150 000 FCFA)">Forfait Professionnel (150 000 FCFA / mois)</option>
                <option value="Forfait Baroni (75 000 FCFA)">Forfait Baroni (75 000 FCFA / mois)</option>
                <option value="Forfait Entreprise / ONG (Sur devis)">Forfait Entreprise / ONG (Sur devis)</option>
                <option value="Podcast Standard (25 000 FCFA)">Podcast Standard (25 000 FCFA)</option>
                <option value="Podcast Pro (35 000 FCFA)">Podcast Pro (35 000 FCFA)</option>
                <option value="Location Studio Seul (10 000 FCFA)">Location Studio Seul (10 000 FCFA)</option>
                <option value="Formation Podcast (50 000 FCFA)">Formation Podcast (50 000 FCFA)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#D0D0D0]">Nom ou Nom d'émission *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Cheick Diallo"
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#606060] outline-none focus:border-[#FFBF00] transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#D0D0D0]">Téléphone / WhatsApp *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+223 ..."
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#606060] outline-none focus:border-[#FFBF00] transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#D0D0D0]">Adresse Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@exemple.com"
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#606060] outline-none focus:border-[#FFBF00] transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#D0D0D0]">Date souhaitée</label>
                <input
                  type="text"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  placeholder="Ex: Cette semaine, Samedi 15h"
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#606060] outline-none focus:border-[#FFBF00] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#D0D0D0]">Précisions / Votre projet (optionnel)</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Nombre d'invités, sujet de l'émission, besoin d'aide au cadrage..."
                className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#606060] outline-none focus:border-[#FFBF00] transition-colors resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <a
                href="https://wa.me/22370000000?text=Bonjour%20Bamako%20Podcast,%20je%20souhaite%20r%C3%A9server%20une%20session%20au%20studio"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[#8E8E8E] hover:text-[#FFBF00] transition-colors flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5 text-[#25D366]" />
                <span>WhatsApp direct</span>
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2.5 rounded-xl bg-[#202020] hover:bg-[#2A2A2A] text-white text-xs font-bold transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-[#FFBF00] hover:bg-[#e6ac00] text-[#0B0B0B] text-xs font-black transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{loading ? "Envoi..." : "Envoyer ma réservation"}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
