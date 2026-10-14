"use client";

import React, { useState } from "react";
import { X, Building2, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { ClientPortal } from "@/components/ui/ClientPortal";

interface AdvertiserInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdvertiserInquiryModal({ isOpen, onClose }: AdvertiserInquiryModalProps) {
  const [company, setCompany] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [targetPeriod, setTargetPeriod] = useState("");
  const [budget, setBudget] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetchApi("/advertiser-inquiries", {
        method: "POST",
        body: JSON.stringify({
          company,
          contactName,
          email,
          phone: phone || undefined,
          targetPeriod: targetPeriod || undefined,
          budget: budget || undefined,
          message,
        }),
      });

      if (!res.success) {
        throw new Error(res.error?.message || "Échec lors de l'envoi de votre demande.");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'envoi. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setSuccess(false);
    setError("");
    setCompany("");
    setContactName("");
    setEmail("");
    setPhone("");
    setTargetPeriod("");
    setBudget("");
    setMessage("");
    onClose();
  };

  return (
    <ClientPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#141414] border border-[#242424] rounded-2xl p-6 shadow-2xl text-white space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-[#FFBF00]" />
            <div>
              <h3 className="text-base font-bold text-white">Annoncer sur Bamako Podcast</h3>
              <p className="text-[11px] text-[#888888]">
                Développez votre visibilité auprès d'une audience engagée et panafricaine.
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 text-[#757575] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-white">Demande enregistrée avec succès</h4>
              <p className="text-xs text-[#A0A0A0] max-w-sm mx-auto">
                Merci {contactName || "pour votre intérêt"}. Notre équipe commerciale étudie votre projet et reviendra vers vous très prochainement à l'adresse <span className="text-[#FFBF00]">{email}</span>.
              </p>
            </div>
            <button
              onClick={handleResetAndClose}
              className="px-6 py-2.5 rounded-xl bg-[#FFBF00] text-[#0B0B0B] font-bold text-xs hover:bg-[#e6ac00] transition-colors"
            >
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="font-semibold text-[#A0A0A0]">Entreprise / Organisation *</label>
                <input
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Ex: Société X, Agence Y"
                  className="w-full px-3 py-2 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white focus:border-[#FFBF00] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#A0A0A0]">Nom du contact *</label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Ex: Aïssata Koné"
                  className="w-full px-3 py-2 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white focus:border-[#FFBF00] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="font-semibold text-[#A0A0A0]">E-mail professionnel *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@entreprise.com"
                  className="w-full px-3 py-2 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white focus:border-[#FFBF00] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#A0A0A0]">Téléphone (facultatif)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+223 ..."
                  className="w-full px-3 py-2 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white focus:border-[#FFBF00] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="font-semibold text-[#A0A0A0]">Période souhaitée</label>
                <input
                  type="text"
                  value={targetPeriod}
                  onChange={(e) => setTargetPeriod(e.target.value)}
                  placeholder="Ex: Novembre 2026, 1 mois..."
                  className="w-full px-3 py-2 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white focus:border-[#FFBF00] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#A0A0A0]">Budget indicatif</label>
                <input
                  type="text"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="Ex: 500 000 FCFA"
                  className="w-full px-3 py-2 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white focus:border-[#FFBF00] outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#A0A0A0]">Message / Objectifs de la campagne *</label>
              <textarea
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Décrivez votre produit, vos objectifs ou votre émission à promouvoir..."
                className="w-full px-3 py-2 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white focus:border-[#FFBF00] outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222222]">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2 rounded-xl bg-[#1E1E1E] text-[#A0A0A0] hover:text-white font-semibold transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#FFBF00] text-[#0B0B0B] font-bold hover:bg-[#e6ac00] transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {loading ? "Envoi en cours..." : "Envoyer la demande"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
    </ClientPortal>
  );
}
