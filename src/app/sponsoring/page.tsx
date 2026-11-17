"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { Megaphone, Radio, Users, Mic2, CheckCircle2, X, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { backdropPointerDown, useEscapeDismiss } from "@/hooks/useModalDismiss";
import { PHONE_COUNTRIES, formatPhoneForCountry } from "@/lib/phone";

export default function SponsoringMarketplacePage() {
  const [selectedLang, setSelectedLang] = useState("");
  const query = selectedLang ? `?language=${encodeURIComponent(selectedLang)}` : "";
  const { data: items, isLoading } = useSWR(`/ads/marketplace${query}`, (url) =>
    fetchApi(url).then((r) => r.data || [])
  );
  const { data: languages } = useSWR("/languages?hasContent=true", (url) =>
    fetchApi(url).then((r) => r.data || [])
  );

  const [bookingTarget, setBookingTarget] = useState<{
    podcast: any;
    slot: { type: string; label: string; priceFcfa: number };
  } | null>(null);

  const [company, setCompany] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [targetPeriod, setTargetPeriod] = useState("Prochain mois");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEscapeDismiss(Boolean(bookingTarget), () => setBookingTarget(null), !submitting);

  const handleBookPlacement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingTarget) return;
    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await fetchApi("/ads/inquiries", {
        method: "POST",
        body: JSON.stringify({
          company: company.trim(),
          contactName: contactName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          targetPeriod,
          budget: `${bookingTarget.slot.priceFcfa.toLocaleString("fr-FR")} FCFA`,
          podcastId: bookingTarget.podcast.id,
          slotType: bookingTarget.slot.type,
          targetLanguage: bookingTarget.podcast.language?.code || undefined,
          message:
            message.trim() ||
            `Demande de placement ${bookingTarget.slot.label} sur l'émission "${bookingTarget.podcast.name}".`,
        }),
      });
      if (!res.success) {
        throw new Error(res.error?.message || res.message || "Erreur lors de l'envoi.");
      }
      setSuccessMsg("Votre demande de sponsoring a été transmise à la régie Bamako Podcast !");
    } catch (err: any) {
      setErrorMsg(err.message || "Impossible d'envoyer la demande.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white px-4 sm:px-6 md:px-10 py-12 pb-28 max-w-6xl mx-auto space-y-10">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141414] border border-[#262626] text-xs font-bold text-[#FFBF00]">
          <Megaphone className="w-3.5 h-3.5" />
          <span>Place de Marché Sponsoring & Audio Ads</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          Associez votre marque aux <span className="text-[#FFBF00]">voix influentes</span> du Mali et de la Diaspora
        </h1>
        <p className="text-xs sm:text-sm text-[#A0A0A0] leading-relaxed">
          Réservez des placements audio (Pre-Roll, Mid-Roll ou lecture par l&apos;animateur) ciblés par émission et par langue.
        </p>
      </div>

      {/* Filtre par langue */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedLang("")}
          className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors ${
            selectedLang === ""
              ? "bg-[#FFBF00] text-black border-[#FFBF00]"
              : "bg-[#141414] text-[#CCC] border-[#262626] hover:border-[#444]"
          }`}
        >
          Toutes les langues
        </button>
        {Array.isArray(languages) &&
          languages.map((l: any) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setSelectedLang(l.code)}
              className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors ${
                selectedLang === l.code
                  ? "bg-[#FFBF00] text-black border-[#FFBF00]"
                  : "bg-[#141414] text-[#CCC] border-[#262626] hover:border-[#444]"
              }`}
            >
              {l.name}
            </button>
          ))}
      </div>

      {/* Grille des émissions sponsorisables */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-[#888]">Chargement des emplacements...</div>
      ) : !Array.isArray(items) || items.length === 0 ? (
        <div className="p-10 rounded-2xl bg-[#141414] border border-[#262626] text-center text-xs text-[#888]">
          Aucune émission disponible pour ce filtre.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item: any) => (
            <div
              key={item.id}
              className="rounded-2xl bg-[#141414] border border-[#242424] p-5 flex flex-col justify-between space-y-4 hover:border-[#383838] transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-xl bg-[#1D1D1D] border border-[#2E2E2E] overflow-hidden shrink-0 flex items-center justify-center">
                    {item.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.cover} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <Radio className="w-6 h-6 text-[#FFBF00]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-white truncate">{item.name}</h2>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#888] mt-1">
                      {item.language?.name && (
                        <span className="px-2 py-0.5 rounded bg-[#1E1E1E] text-[#FFBF00] font-semibold">
                          {item.language.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {item.followersCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mic2 className="w-3 h-3" /> {item.episodesCount} ép.
                      </span>
                    </div>
                  </div>
                </div>

                {item.shortDescription && (
                  <p className="text-xs text-[#9E9E9E] line-clamp-2 leading-relaxed">
                    {item.shortDescription}
                  </p>
                )}

                <div className="space-y-2 pt-2 border-t border-[#222222]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#777]">
                    Placements disponibles
                  </p>
                  {item.slots.map((slot: any) => (
                    <button
                      key={slot.type}
                      type="button"
                      onClick={() => {
                        setSuccessMsg("");
                        setErrorMsg("");
                        setBookingTarget({ podcast: item, slot });
                      }}
                      className="w-full p-2.5 rounded-xl bg-[#1A1A1A] hover:bg-[#222222] border border-[#2A2A2A] hover:border-[#FFBF00]/60 transition-colors flex items-center justify-between text-xs"
                    >
                      <span className="text-[#DDD] font-semibold">{slot.label}</span>
                      <span className="font-mono font-bold text-[#FFBF00]">
                        {slot.priceFcfa.toLocaleString("fr-FR")} F
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal réservation placement */}
      {bookingTarget && (
        <div
          onPointerDown={backdropPointerDown(() => setBookingTarget(null), !submitting)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg bg-[#141414] border border-[#262626] rounded-2xl p-6 space-y-4 text-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#222222] pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Réserver un placement audio</h3>
                <p className="text-xs text-[#FFBF00] mt-0.5">
                  {bookingTarget.podcast.name} • {bookingTarget.slot.label} (
                  {bookingTarget.slot.priceFcfa.toLocaleString("fr-FR")} FCFA)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBookingTarget(null)}
                className="p-1 text-[#777] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {successMsg ? (
              <div className="py-6 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <p className="text-sm font-bold text-white">{successMsg}</p>
                <button
                  type="button"
                  onClick={() => setBookingTarget(null)}
                  className="px-6 py-2.5 rounded-xl bg-[#FFBF00] text-black font-bold text-xs"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookPlacement} className="space-y-3 text-xs">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300">
                    {errorMsg}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-[#CCC] block mb-1">Entreprise / Marque *</label>
                    <input
                      type="text"
                      required
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white outline-none focus:border-[#FFBF00]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[#CCC] block mb-1">Nom du contact *</label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white outline-none focus:border-[#FFBF00]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-[#CCC] block mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white outline-none focus:border-[#FFBF00]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[#CCC] block mb-1">Téléphone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const matched = PHONE_COUNTRIES.find((c) => raw.startsWith(c.dial));
                        if (matched) {
                          const f = formatPhoneForCountry(raw.slice(matched.dial.length), matched.dial);
                          setPhone(f ? `${matched.dial} ${f}` : matched.dial);
                        } else {
                          setPhone(formatPhoneForCountry(raw, "+223"));
                        }
                      }}
                      placeholder="66 00 00 00"
                      className="w-full px-3 py-2 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white font-mono outline-none focus:border-[#FFBF00]"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-semibold text-[#CCC] block mb-1">Période souhaitée</label>
                  <input
                    type="text"
                    value={targetPeriod}
                    onChange={(e) => setTargetPeriod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white outline-none focus:border-[#FFBF00]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#CCC] block mb-1">Brief / Message</label>
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Objectifs de campagne, message clé..."
                    className="w-full px-3 py-2 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white outline-none focus:border-[#FFBF00] resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-[#FFBF00] hover:bg-[#E6AC00] text-black font-black flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Envoyer la demande de placement</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
