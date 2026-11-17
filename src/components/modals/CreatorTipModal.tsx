"use client";

import React, { useState } from "react";
import { Heart, X, CheckCircle2, AlertCircle, Phone, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { ClientPortal } from "@/components/ui/ClientPortal";
import { useAuthStore } from "@/store/authStore";
import { backdropPointerDown, useEscapeDismiss } from "@/hooks/useModalDismiss";
import {
  PHONE_COUNTRIES,
  formatPhoneForCountry,
  getCountryRule,
  extractDigits,
} from "@/lib/phone";

interface CreatorTipModalProps {
  isOpen: boolean;
  onClose: () => void;
  podcastId: string;
  podcastName: string;
  episodeId?: string;
  onSuccess?: () => void;
}

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000];

const PAYMENT_METHODS = [
  { id: "ORANGE_MONEY", label: "Orange Money" },
  { id: "WAVE", label: "Wave" },
  { id: "MOOV_MONEY", label: "Moov Money" },
  { id: "CARD", label: "Carte Bancaire" },
];

export function CreatorTipModal({
  isOpen,
  onClose,
  podcastId,
  podcastName,
  episodeId,
  onSuccess,
}: CreatorTipModalProps) {
  const { user } = useAuthStore();
  const [amount, setAmount] = useState<number>(1000);
  const [paymentMethod, setPaymentMethod] = useState<string>("ORANGE_MONEY");
  const [supporterName, setSupporterName] = useState<string>(user?.fullName || "");
  const [supporterEmail, setSupporterEmail] = useState<string>(user?.email || "");
  const [countryCode, setCountryCode] = useState<string>("+223");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<any>(null);

  useEscapeDismiss(isOpen, onClose, !isSubmitting);

  if (!isOpen) return null;

  const handleResetAndClose = () => {
    setReceipt(null);
    setError("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supporterName.trim()) {
      setError("Veuillez indiquer votre nom.");
      return;
    }
    if (amount < 500) {
      setError("Le montant minimum est de 500 FCFA.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const res = await fetchApi(`/podcasts/${podcastId}/tip`, {
        method: "POST",
        body: JSON.stringify({
          episodeId,
          supporterName: supporterName.trim(),
          supporterEmail: supporterEmail.trim() || undefined,
          message: message.trim() || undefined,
          amount,
          paymentMethod,
          phoneNumber: phoneNumber ? `${countryCode} ${extractDigits(phoneNumber)}` : undefined,
        }),
      });
      if (!res.success || !res.data) {
        throw new Error(res.error?.message || res.message || "Échec du soutien.");
      }
      setReceipt(res.data);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'envoi du soutien.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ClientPortal>
      <div
        onPointerDown={backdropPointerDown(handleResetAndClose, !isSubmitting)}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
        role="dialog"
        aria-modal="true"
      >
        <div className="relative w-full max-w-md bg-[#141414] border border-[#262626] rounded-2xl p-6 shadow-2xl text-white space-y-5 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#1F1810] border border-[#FFBF00]/30 text-[#FFBF00]">
                <Heart className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">Soutenir le créateur</h3>
                <p className="text-[11px] text-[#888888] truncate max-w-[230px]">{podcastName}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResetAndClose}
              className="p-1.5 text-[#777] hover:text-white rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {receipt ? (
            <div className="py-5 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-white">Merci pour votre soutien !</h4>
                <p className="text-xs text-[#AAA]">
                  <strong className="text-[#FFBF00]">{receipt.amount?.toLocaleString("fr-FR")} FCFA</strong> envoyés à{" "}
                  <strong className="text-white">{podcastName}</strong>.
                </p>
                <p className="text-[11px] font-mono text-[#777]">Réf : {receipt.transactionRef}</p>
              </div>
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-6 py-2.5 rounded-xl bg-[#FFBF00] hover:bg-[#E6AC00] text-black font-bold text-xs"
              >
                Fermer
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#CCC]">Montant du soutien (FCFA)</label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_AMOUNTS.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                        amount === val
                          ? "bg-[#FFBF00] text-black border-[#FFBF00]"
                          : "bg-[#1A1A1A] text-[#DDD] border-[#2A2A2A] hover:border-[#444]"
                      }`}
                    >
                      {val.toLocaleString("fr-FR")} F
                    </button>
                  ))}
                  <input
                    type="number"
                    min={500}
                    step={100}
                    value={amount}
                    onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                    className="px-2.5 py-2 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] text-xs text-white text-center font-mono outline-none focus:border-[#FFBF00]"
                    placeholder="Autre"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#CCC]">Moyen de paiement</label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                        paymentMethod === m.id
                          ? "bg-[#1C1810] border-[#FFBF00] text-[#FFBF00]"
                          : "bg-[#1A1A1A] border-[#2A2A2A] text-[#CCC] hover:border-[#444]"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod !== "CARD" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#CCC] flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#FFBF00]" />
                    <span>Numéro Mobile Money</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => {
                        const next = e.target.value;
                        setCountryCode(next);
                        setPhoneNumber((prev) => formatPhoneForCountry(prev, next));
                      }}
                      className="w-36 bg-[#181818] border border-[#2A2A2A] rounded-xl px-2 py-2 text-xs text-white outline-none"
                    >
                      {PHONE_COUNTRIES.slice(0, 8).map((c) => (
                        <option key={c.code} value={c.dial}>
                          {c.flag} {c.dial}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(formatPhoneForCountry(e.target.value, countryCode))}
                      placeholder={getCountryRule(countryCode).placeholder}
                      className="flex-1 bg-[#181818] border border-[#2A2A2A] rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-[#FFBF00]"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#CCC]">Votre nom *</label>
                  <input
                    type="text"
                    required
                    value={supporterName}
                    onChange={(e) => setSupporterName(e.target.value)}
                    placeholder="Ex: Aminata"
                    className="w-full bg-[#181818] border border-[#2A2A2A] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FFBF00]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#CCC]">Email (reçu)</label>
                  <input
                    type="email"
                    value={supporterEmail}
                    onChange={(e) => setSupporterEmail(e.target.value)}
                    placeholder="optionnel"
                    className="w-full bg-[#181818] border border-[#2A2A2A] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FFBF00]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#CCC]">Message d&apos;encouragement (optionnel)</label>
                <textarea
                  rows={2}
                  maxLength={250}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Bravo pour la qualité de vos émissions !"
                  className="w-full bg-[#181818] border border-[#2A2A2A] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FFBF00] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-[#FFBF00] hover:bg-[#E6AC00] text-black font-black text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
                <span>{isSubmitting ? "Traitement..." : `Envoyer ${amount.toLocaleString("fr-FR")} FCFA`}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </ClientPortal>
  );
}
