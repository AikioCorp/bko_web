"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Mic,
  Video,
  Scissors,
  Sparkles,
  Compass,
  Layers,
  Calendar,
  Clock,
  Users,
  Building2,
  Phone,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ArrowLeft,
  FileText,
  DollarSign,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { ClientPortal } from "@/components/ui/ClientPortal";
import { useAuthStore } from "@/store/authStore";

export type StudioNeedType =
  | "AUDIO_PODCAST"
  | "VIDEO_PODCAST"
  | "EDITING"
  | "SNIPPETS"
  | "COACHING"
  | "CUSTOM";

interface NeedOption {
  type: StudioNeedType;
  title: string;
  tagline: string;
  icon: React.ReactNode;
  suggestedOfferName?: string;
}

const NEED_OPTIONS: NeedOption[] = [
  {
    type: "AUDIO_PODCAST",
    title: "Enregistrer un podcast audio",
    tagline: "Microphones broadcast Shure SM7B, acoustique traitée et ingénieur du son.",
    icon: <Mic className="w-5 h-5 text-[#FFBF00]" />,
    suggestedOfferName: "Enregistrement Brut",
  },
  {
    type: "VIDEO_PODCAST",
    title: "Enregistrer un podcast vidéo",
    tagline: "Plateau multi-caméras 4K, réalisation live ou montage post-session.",
    icon: <Video className="w-5 h-5 text-[#FFBF00]" />,
    suggestedOfferName: "Formule Express",
  },
  {
    type: "EDITING",
    title: "Faire monter un contenu existant",
    tagline: "Dérushage, nettoyage audio, étalonnage vidéo et mixage professionnel.",
    icon: <Scissors className="w-5 h-5 text-[#FFBF00]" />,
    suggestedOfferName: "Montage & Post-production complète",
  },
  {
    type: "SNIPPETS",
    title: "Créer des extraits (Shorts & Reels)",
    tagline: "Découpage vertical 9:16 avec sous-titres mot-à-mot dynamiques et titrage viral.",
    icon: <Sparkles className="w-5 h-5 text-[#FFBF00]" />,
    suggestedOfferName: "Pack Shorts & Reels",
  },
  {
    type: "COACHING",
    title: "Recevoir un accompagnement",
    tagline: "Direction éditoriale, structuration du concept, stratégie d'audience et monétisation.",
    icon: <Compass className="w-5 h-5 text-[#FFBF00]" />,
    suggestedOfferName: "Coaching & Direction Éditoriale",
  },
  {
    type: "CUSTOM",
    title: "Projet sur mesure / Événement",
    tagline: "Captation live extérieure, convention d'entreprise, série documentaire institutionnelle.",
    icon: <Layers className="w-5 h-5 text-[#FFBF00]" />,
  },
];

const COUNTRY_CODES = [
  { code: "+223", label: "🇲🇱 Mali (+223)" },
  { code: "+225", label: "🇨🇮 Côte d'Ivoire (+225)" },
  { code: "+221", label: "🇸🇳 Sénégal (+221)" },
  { code: "+224", label: "🇬🇳 Guinée (+224)" },
  { code: "+226", label: "🇧🇫 Burkina Faso (+226)" },
  { code: "+227", label: "🇳🇪 Niger (+227)" },
  { code: "+228", label: "🇹🇬 Togo (+228)" },
  { code: "+229", label: "🇧🇯 Bénin (+229)" },
  { code: "+237", label: "🇨🇲 Cameroun (+237)" },
  { code: "+33", label: "🇫🇷 France (+33)" },
  { code: "+1", label: "🇺🇸/🇨🇦 USA / Canada (+1)" },
  { code: "+32", label: "🇧🇪 Belgique (+32)" },
  { code: "+41", label: "🇨🇭 Suisse (+41)" },
  { code: "+44", label: "🇬🇧 Royaume-Uni (+44)" },
];

const TIME_SLOTS = [
  { id: "MATIN", label: "Matin (09h00 — 12h00)" },
  { id: "APRES_MIDI", label: "Après-midi (14h00 — 17h00)" },
  { id: "SOIREE", label: "Soirée (18h00 — 21h00)" },
  { id: "JOURNEE", label: "Journée complète (09h00 — 18h00)" },
  { id: "FLEXIBLE", label: "Créneau flexible (à convenir)" },
];

const STUDIO_LOCATIONS = [
  { id: "STUDIO_PRINCIPAL", label: "Studio Principal (1 à 4 micros, acoustique broadcast)" },
  { id: "SALLE_CONFERENCE", label: "Salle de Conférence (Table ronde jusqu'à 8 intervenants)" },
  { id: "SALLE_VIP", label: "Espace Salon VIP (Ambiance feutrée, fauteuils club)" },
  { id: "EXTERIEUR", label: "Déplacement / Tournage extérieur à Bamako" },
  { id: "DISTANCIEL", label: "À distance / 100% en ligne (pour montage & coaching)" },
];

interface StudioBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedService?: string;
}

export function StudioBookingModal({ isOpen, onClose, preselectedService }: StudioBookingModalProps) {
  const { user, isAuthenticated } = useAuthStore();

  // Étape courante du formulaire (1: Besoin, 2: Organisation, 3: Récapitulatif, 4: Succès)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Données serveur : offres tarifaires dynamiques
  const [serverOffers, setServerOffers] = useState<any[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);

  // --- ÉTAPE 1 : Choix du besoin & offre ---
  const [selectedNeed, setSelectedNeed] = useState<StudioNeedType>("AUDIO_PODCAST");
  const [selectedOfferId, setSelectedOfferId] = useState<string>("");

  // --- ÉTAPE 2 : Organisation & Paramètres modulaires ---
  // Podcast Audio / Vidéo
  const [preferredDate, setPreferredDate] = useState<string>("");
  const [timeSlot, setTimeSlot] = useState<string>("MATIN");
  const [durationHours, setDurationHours] = useState<number>(2);
  const [participantsCount, setParticipantsCount] = useState<number>(2);
  const [studioLocation, setStudioLocation] = useState<string>("STUDIO_PRINCIPAL");
  const [shootingNeeds, setShootingNeeds] = useState<string>("MULTI_CAM");

  // Montage & Post-production
  const [mediaFilesUrl, setMediaFilesUrl] = useState<string>("");
  const [sourceDuration, setSourceDuration] = useState<string>("60 minutes");
  const [targetDeadline, setTargetDeadline] = useState<string>("");
  const [expectedResult, setExpectedResult] = useState<string>("Master audio et vidéo mixé prêt à diffuser");

  // Extraits Shorts & Reels
  const [snippetsCount, setSnippetsCount] = useState<number>(3);
  const [aspectRatios, setAspectRatios] = useState<string[]>(["9:16"]);
  const [subtitlesNeeded, setSubtitlesNeeded] = useState<boolean>(true);

  // Coaching & Accompagnement
  const [coachingGoal, setCoachingGoal] = useState<string>("Lancement et positionnement d'une nouvelle émission");
  const [projectStage, setProjectStage] = useState<string>("IDEE");

  // Précisions libres
  const [notes, setNotes] = useState<string>("");

  // --- ÉTAPE 3 : Coordonnées de contact ---
  const [contactName, setContactName] = useState<string>("");
  const [podcastName, setPodcastName] = useState<string>("");
  const [company, setCompany] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [countryCode, setCountryCode] = useState<string>("+223");
  const [phone, setPhone] = useState<string>("");

  // États de soumission et résultat
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [createdBooking, setCreatedBooking] = useState<any>(null);

  // Charger les offres actives depuis le serveur
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setLoadingOffers(true);

    fetchApi("/studio-offers")
      .then((res) => {
        if (isMounted && res.success && Array.isArray(res.data)) {
          setServerOffers(res.data);
        }
      })
      .catch((err) => {
        console.warn("Impossible de charger les offres studio dynamiques:", err);
      })
      .finally(() => {
        if (isMounted) setLoadingOffers(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Initialisation à l'ouverture & préremplissage utilisateur
  useEffect(() => {
    if (isOpen) {
      if (isAuthenticated && user) {
        if (!contactName) setContactName(user.fullName || "");
        if (!email) setEmail(user.email || "");
        if (!phone && user.phoneNumber) {
          // Extraire l'indicatif si présent
          const cleanPhone = user.phoneNumber.trim();
          if (cleanPhone.startsWith("+")) {
            const parts = cleanPhone.split(" ");
            if (parts.length > 1) {
              setCountryCode(parts[0]);
              setPhone(parts.slice(1).join(" "));
            } else {
              setPhone(cleanPhone);
            }
          } else {
            setPhone(cleanPhone);
          }
        }
      }

      // Pré-sélection basée sur preselectedService
      if (preselectedService) {
        const s = preselectedService.toLowerCase();
        if (s.includes("express") || s.includes("vidéo") || s.includes("video")) {
          setSelectedNeed("VIDEO_PODCAST");
        } else if (s.includes("montage") || s.includes("post-production")) {
          setSelectedNeed("EDITING");
        } else if (s.includes("short") || s.includes("reel") || s.includes("extrait")) {
          setSelectedNeed("SNIPPETS");
        } else if (s.includes("coach") || s.includes("accompagnement")) {
          setSelectedNeed("COACHING");
        } else if (s.includes("sur mesure")) {
          setSelectedNeed("CUSTOM");
        } else {
          setSelectedNeed("AUDIO_PODCAST");
        }
      }
    }
  }, [isOpen, preselectedService, isAuthenticated, user]);

  // Associer automatiquement l'offre serveur correspondante au besoin choisi
  const currentMatchingOffer = useMemo(() => {
    if (selectedOfferId) {
      const match = serverOffers.find((o) => o.id === selectedOfferId);
      if (match) return match;
    }
    const currentNeedDef = NEED_OPTIONS.find((n) => n.type === selectedNeed);
    if (!currentNeedDef?.suggestedOfferName) return null;
    return (
      serverOffers.find((o) =>
        o.name.toLowerCase().includes(currentNeedDef.suggestedOfferName!.toLowerCase())
      ) || null
    );
  }, [selectedNeed, selectedOfferId, serverOffers]);

  // Estimation tarifaire indicative
  const estimatedPricing = useMemo(() => {
    if (selectedNeed === "CUSTOM") {
      return "Sur devis personnalisé";
    }
    if (currentMatchingOffer) {
      if (selectedNeed === "AUDIO_PODCAST") {
        const base = parseInt(currentMatchingOffer.price.replace(/\s/g, ""), 10) || 20000;
        return `${(base * durationHours).toLocaleString("fr-FR")} FCFA (${durationHours}h)`;
      }
      if (selectedNeed === "VIDEO_PODCAST") {
        const base = parseInt(currentMatchingOffer.price.replace(/\s/g, ""), 10) || 35000;
        return `${(base * durationHours).toLocaleString("fr-FR")} FCFA (${durationHours}h)`;
      }
      if (selectedNeed === "SNIPPETS") {
        const base = parseInt(currentMatchingOffer.price.replace(/\s/g, ""), 10) || 15000;
        const packs = Math.ceil(snippetsCount / 3);
        return `${(base * packs).toLocaleString("fr-FR")} FCFA (${snippetsCount} extraits)`;
      }
      return `${currentMatchingOffer.price} ${currentMatchingOffer.unit || "FCFA"}`;
    }
    return "Estimation fournie par l'équipe";
  }, [selectedNeed, currentMatchingOffer, durationHours, snippetsCount]);

  if (!isOpen) return null;

  // Validation par étape
  const canGoToStep2 = () => Boolean(selectedNeed);
  const canGoToStep3 = () => {
    if (selectedNeed === "AUDIO_PODCAST" || selectedNeed === "VIDEO_PODCAST") {
      return Boolean(preferredDate && timeSlot && durationHours > 0);
    }
    if (selectedNeed === "EDITING") {
      return Boolean(mediaFilesUrl.trim() || notes.trim());
    }
    return true;
  };
  const canSubmit = () => {
    return Boolean(contactName.trim() && email.trim() && phone.trim());
  };

  const handleNext = () => {
    setSubmitError("");
    if (currentStep === 1 && canGoToStep2()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && canGoToStep3()) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    setSubmitError("");
    if (currentStep === 3) setCurrentStep(2);
    else if (currentStep === 2) setCurrentStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit()) {
      setSubmitError("Veuillez renseigner votre nom, adresse email et numéro de téléphone.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const payload = {
        needType: selectedNeed,
        offerId: currentMatchingOffer?.id || undefined,
        contactName: contactName.trim(),
        podcastName: podcastName.trim() || undefined,
        company: company.trim() || undefined,
        email: email.trim(),
        phone: phone.trim(),
        countryCode,
        preferredDate: preferredDate || undefined,
        timeSlot: timeSlot || undefined,
        durationHours: selectedNeed === "AUDIO_PODCAST" || selectedNeed === "VIDEO_PODCAST" ? durationHours : undefined,
        participantsCount: selectedNeed === "AUDIO_PODCAST" || selectedNeed === "VIDEO_PODCAST" ? participantsCount : undefined,
        studioLocation: selectedNeed === "AUDIO_PODCAST" || selectedNeed === "VIDEO_PODCAST" ? studioLocation : undefined,
        shootingNeeds: selectedNeed === "VIDEO_PODCAST" ? shootingNeeds : undefined,
        mediaFilesUrl: selectedNeed === "EDITING" || selectedNeed === "SNIPPETS" ? mediaFilesUrl : undefined,
        targetDeadline: targetDeadline || undefined,
        expectedResult: expectedResult || undefined,
        snippetsCount: selectedNeed === "SNIPPETS" ? snippetsCount : undefined,
        aspectRatios: selectedNeed === "SNIPPETS" ? aspectRatios : undefined,
        subtitlesNeeded: selectedNeed === "SNIPPETS" ? subtitlesNeeded : undefined,
        coachingGoal: selectedNeed === "COACHING" ? coachingGoal : undefined,
        projectStage: selectedNeed === "COACHING" ? projectStage : undefined,
        notes: notes.trim() || undefined,
        estimatedPrice: estimatedPricing,
      };

      const res = await fetchApi("/studio/bookings", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.success || !res.data) {
        throw new Error(res.error?.message || res.message || "Impossible d'enregistrer votre demande Studio.");
      }

      setCreatedBooking(res.data);
      setCurrentStep(4);
    } catch (err: any) {
      setSubmitError(err.message || "Une erreur est survenue lors de l'enregistrement de votre demande.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseAndReset = () => {
    setCurrentStep(1);
    setSubmitError("");
    setCreatedBooking(null);
    onClose();
  };

  return (
    <ClientPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in select-none overflow-y-auto">
        <div className="relative w-full max-w-2xl bg-[#121212] border border-[#262626] rounded-3xl p-6 sm:p-8 text-white shadow-2xl my-auto space-y-6">
          {/* Header & Fil d'ariane */}
          <div className="flex items-start justify-between border-b border-[#202020] pb-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-[#1C1C1C] text-[#FFBF00] border border-[#2E2E2E]">
                  <Mic className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-xl font-bold text-white">Réserver le Studio Bamako Podcast</h2>
                  <p className="text-xs text-[#8E8E8E]">
                    Production professionnelle, enregistrement broadcast et accompagnement sur mesure.
                  </p>
                </div>
              </div>

              {/* Indicateur d'étapes */}
              {currentStep !== 4 && (
                <div className="flex items-center gap-2 pt-2 text-xs">
                  <span
                    className={`flex items-center gap-1.5 font-semibold px-2.5 py-1 rounded-lg ${
                      currentStep === 1
                        ? "bg-[#FFBF00] text-black font-bold"
                        : "bg-[#1E1E1E] text-[#8E8E8E]"
                    }`}
                  >
                    1. Votre besoin
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#555]" />
                  <span
                    className={`flex items-center gap-1.5 font-semibold px-2.5 py-1 rounded-lg ${
                      currentStep === 2
                        ? "bg-[#FFBF00] text-black font-bold"
                        : "bg-[#1E1E1E] text-[#8E8E8E]"
                    }`}
                  >
                    2. Organisation
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#555]" />
                  <span
                    className={`flex items-center gap-1.5 font-semibold px-2.5 py-1 rounded-lg ${
                      currentStep === 3
                        ? "bg-[#FFBF00] text-black font-bold"
                        : "bg-[#1E1E1E] text-[#8E8E8E]"
                    }`}
                  >
                    3. Récapitulatif
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handleCloseAndReset}
              className="p-2 rounded-xl text-[#777] hover:text-white hover:bg-[#202020] transition-colors"
              aria-label="Fermer la modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Message d'erreur global */}
          {submitError && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{submitError}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ÉTAPE 1 : DE QUOI AVEZ-VOUS BESOIN ?                                      */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">De quoi avez-vous besoin ?</h3>
                <p className="text-xs text-[#8E8E8E]">
                  Sélectionnez le type de prestation. Le questionnaire s'adaptera automatiquement à votre projet.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {NEED_OPTIONS.map((opt) => {
                  const isSelected = selectedNeed === opt.type;
                  return (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => setSelectedNeed(opt.type)}
                      className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? "bg-[#1B1B1B] border-[#FFBF00] ring-1 ring-[#FFBF00]/30 shadow-lg"
                          : "bg-[#151515] border-[#262626] hover:bg-[#1A1A1A] hover:border-[#383838]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-xl shrink-0 ${
                            isSelected ? "bg-[#FFBF00]/20 text-[#FFBF00]" : "bg-[#202020] text-[#AAA]"
                          }`}
                        >
                          {opt.icon}
                        </div>
                        <div>
                          <p className={`text-xs font-bold ${isSelected ? "text-white" : "text-[#DDD]"}`}>
                            {opt.title}
                          </p>
                          <p className="text-[11px] text-[#7E7E7E] mt-1 leading-snug">{opt.tagline}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Offre serveur associée & tarif indicatif */}
              {currentMatchingOffer && (
                <div className="p-3.5 rounded-2xl bg-[#161616] border border-[#2A2A2A] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#FFBF00]" />
                    <span className="text-[#AAA]">Formule recommandée :</span>
                    <strong className="text-white font-semibold">{currentMatchingOffer.name}</strong>
                  </div>
                  <span className="font-bold text-[#FFBF00]">
                    {currentMatchingOffer.price} {currentMatchingOffer.unit || "FCFA"}
                  </span>
                </div>
              )}

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canGoToStep2()}
                  className="px-6 py-2.5 rounded-xl bg-[#FFBF00] hover:bg-[#E6AC00] text-black font-bold text-xs transition-colors flex items-center gap-2"
                >
                  <span>Étape suivante : Organisation</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ÉTAPE 2 : QUESTIONS ADAPTÉES AU BESOIN SÉLECTIONNÉ                        */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white mb-0.5">
                    Organisation & Paramètres du projet
                  </h3>
                  <p className="text-xs text-[#8E8E8E]">
                    Précisez les détails pratiques selon votre besoin.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#202020] text-[#FFBF00] border border-[#2E2E2E]">
                  {NEED_OPTIONS.find((n) => n.type === selectedNeed)?.title}
                </span>
              </div>

              {/* CAS 1 : ENREGISTREMENT AUDIO OU VIDÉO */}
              {(selectedNeed === "AUDIO_PODCAST" || selectedNeed === "VIDEO_PODCAST") && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#CCC] flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#FFBF00]" />
                        <span>Date souhaitée *</span>
                      </label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split("T")[0]}
                        value={preferredDate}
                        onChange={(e) => setPreferredDate(e.target.value)}
                        className="w-full bg-[#181818] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FFBF00] transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#CCC] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#FFBF00]" />
                        <span>Créneau horaire préféré *</span>
                      </label>
                      <select
                        value={timeSlot}
                        onChange={(e) => setTimeSlot(e.target.value)}
                        className="w-full bg-[#181818] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FFBF00] transition-colors"
                      >
                        {TIME_SLOTS.map((slot) => (
                          <option key={slot.id} value={slot.id}>
                            {slot.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#CCC] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#FFBF00]" />
                        <span>Durée prévue de la session</span>
                      </label>
                      <select
                        value={durationHours}
                        onChange={(e) => setDurationHours(Number(e.target.value))}
                        className="w-full bg-[#181818] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FFBF00] transition-colors"
                      >
                        <option value={1}>1 heure</option>
                        <option value={2}>2 heures (recommandé)</option>
                        <option value={3}>3 heures</option>
                        <option value={4}>Demi-journée (4 heures)</option>
                        <option value={8}>Journée complète (8 heures)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#CCC] flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#FFBF00]" />
                        <span>Nombre de participants autour du micro</span>
                      </label>
                      <select
                        value={participantsCount}
                        onChange={(e) => setParticipantsCount(Number(e.target.value))}
                        className="w-full bg-[#181818] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FFBF00] transition-colors"
                      >
                        <option value={1}>1 personne (solo / monologue)</option>
                        <option value={2}>2 personnes (hôte + 1 invité)</option>
                        <option value={3}>3 personnes</option>
                        <option value={4}>4 personnes (table ronde standard)</option>
                        <option value={6}>5 à 6 personnes</option>
                        <option value={8}>Plus de 6 personnes (Salle de conférence)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#CCC] flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#FFBF00]" />
                      <span>Espace de tournage souhaité</span>
                    </label>
                    <select
                      value={studioLocation}
                      onChange={(e) => setStudioLocation(e.target.value)}
                      className="w-full bg-[#181818] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FFBF00] transition-colors"
                    >
                      {STUDIO_LOCATIONS.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedNeed === "VIDEO_PODCAST" && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#CCC]">Besoins spécifiques de captation</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {[
                          { id: "MULTI_CAM", label: "Multi-caméras 4K avec réalisation en direct" },
                          { id: "PROMPTER", label: "Téléprompteur professionnel disponible" },
                          { id: "CUSTOM_BRANDING", label: "Incrustation de logo et habillage graphique live" },
                          { id: "RAW_FOOTAGE", label: "Livraison des rushs bruts séparés sur disque" },
                        ].map((b) => (
                          <label
                            key={b.id}
                            className="p-2.5 rounded-xl bg-[#181818] border border-[#282828] flex items-center gap-2 cursor-pointer hover:border-[#3A3A3A]"
                          >
                            <input
                              type="checkbox"
                              checked={shootingNeeds.includes(b.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setShootingNeeds((prev) => (prev ? `${prev},${b.id}` : b.id));
                                } else {
                                  setShootingNeeds((prev) =>
                                    prev
                                      .split(",")
                                      .filter((x) => x !== b.id)
                                      .join(",")
                                  );
                                }
                              }}
                              className="accent-[#FFBF00]"
                            />
                            <span className="text-[#DDD] text-[11px]">{b.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CAS 2 : MONTAGE & POST-PRODUCTION */}
              {selectedNeed === "EDITING" && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#CCC]">
                      Lien vers vos fichiers sources bruts (Google Drive, Dropbox, WeTransfer...)
                    </label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/drive/folders/..."
                      value={mediaFilesUrl}
                      onChange={(e) => setMediaFilesUrl(e.target.value)}
                      className="w-full bg-[#181818] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FFBF00] transition-colors"
                    />
                    <p className="text-[11px] text-[#7E7E7E]">
                      Si vos fichiers ne sont pas encore prêts, vous pouvez laisser ce champ vide et nous les envoyer ultérieurement.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#CCC]">Durée approximative des rushs</label>
                      <input
                        type="text"
                        placeholder="Ex: 45 min, 1h30..."
                        value={sourceDuration}
                        onChange={(e) => setSourceDuration(e.target.value)}
                        className="w-full bg-[#181818] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FFBF00] transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#CCC]">Échéance de livraison souhaitée</label>
                      <input
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        value={targetDeadline}
                        onChange={(e) => setTargetDeadline(e.target.value)}
                        className="w-full bg-[#181818] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FFBF00] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#CCC]">Résultat & Format attendu</label>
                    <input
                      type="text"
                      placeholder="Ex: Épisode MP3 masterisé + vidéo 1080p avec transitions"
                      value={expectedResult}
                      onChange={(e) => setExpectedResult(e.target.value)}
                      className="w-full bg-[#181818] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FFBF00] transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* CAS 3 : CRÉATION D'EXTRAITS (SHORTS & REELS) */}
              {selectedNeed === "SNIPPETS" && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#CCC]">
                      Lien de l'épisode ou des rushs à découper
                    </label>
                    <input
                      type="url"
                      placeholder="Lien YouTube, Drive ou Bamako Podcast..."
                      value={mediaFilesUrl}
                      onChange={(e) => setMediaFilesUrl(e.target.value)}
                      className="w-full bg-[#181818] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FFBF00] transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#CCC]">Nombre d'extraits souhaités</label>
                      <select
                        value={snippetsCount}
                        onChange={(e) => setSnippetsCount(Number(e.target.value))}
                        className="w-full bg-[#181818] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FFBF00] transition-colors"
                      >
                        <option value={3}>Pack 3 extraits (15 000 FCFA)</option>
                        <option value={5}>Pack 5 extraits</option>
                        <option value={10}>Pack 10 extraits (Campagne mensuelle)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#CCC]">Sous-titres animés mot-à-mot</label>
                      <select
                        value={subtitlesNeeded ? "YES" : "NO"}
                        onChange={(e) => setSubtitlesNeeded(e.target.value === "YES")}
                        className="w-full bg-[#181818] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FFBF00] transition-colors"
                      >
                        <option value="YES">Oui, sous-titres dynamiques inclus (recommandé)</option>
                        <option value="NO">Non, extraits sans sous-titres</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#CCC]">Ratio et format d'export</label>
                    <div className="flex gap-2">
                      {[
                        { id: "9:16", label: "9:16 Vertical (TikTok, Reels, Shorts)" },
                        { id: "1:1", label: "1:1 Carré (Instagram feed, LinkedIn)" },
                        { id: "16:9", label: "16:9 Paysage (YouTube standard)" },
                      ].map((ratio) => (
                        <button
                          key={ratio.id}
                          type="button"
                          onClick={() => {
                            if (aspectRatios.includes(ratio.id)) {
                              if (aspectRatios.length > 1) {
                                setAspectRatios(aspectRatios.filter((r) => r !== ratio.id));
                              }
                            } else {
                              setAspectRatios([...aspectRatios, ratio.id]);
                            }
                          }}
                          className={`flex-1 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                            aspectRatios.includes(ratio.id)
                              ? "bg-[#1F1F1F] border-[#FFBF00] text-white"
                              : "bg-[#151515] border-[#2A2A2A] text-[#888]"
                          }`}
                        >
                          {ratio.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* CAS 4 : COACHING & ACCOMPAGNEMENT */}
              {selectedNeed === "COACHING" && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#CCC]">Objectif principal de la session</label>
                    <select
                      value={coachingGoal}
                      onChange={(e) => setCoachingGoal(e.target.value)}
                      className="w-full bg-[#181818] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FFBF00] transition-colors"
                    >
                      <option value="Lancement et positionnement d'une nouvelle émission">
                        Lancement & positionnement d'une nouvelle émission
                      </option>
                      <option value="Direction éditoriale et préparation d'interviews">
                        Direction éditoriale & préparation d'interviews
                      </option>
                      <option value="Optimisation de la diffusion et croissance d'audience">
                        Optimisation de la diffusion & croissance d'audience
                      </option>
                      <option value="Monétisation, sponsoring et partenariats marques">
                        Monétisation, sponsoring & partenariats marques
                      </option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#CCC]">Stade actuel de votre projet</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "IDEE", label: "Simple idée / Concept" },
                        { id: "EN_COURS", label: "En cours de lancement" },
                        { id: "DEJA_LANCE", label: "Déjà lancé & diffusé" },
                      ].map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setProjectStage(st.id)}
                          className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                            projectStage === st.id
                              ? "bg-[#1F1F1F] border-[#FFBF00] text-white"
                              : "bg-[#151515] border-[#2A2A2A] text-[#888]"
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* CAS 5 : SUR MESURE / REMARQUES */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-[#CCC]">
                  Précisions complémentaires / Vos attentes (Optionnel)
                </label>
                <textarea
                  rows={2}
                  placeholder="Besoins particuliers, questions techniques, équipement additionnel..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#181818] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs text-white placeholder-[#606060] outline-none focus:border-[#FFBF00] transition-colors resize-none"
                />
              </div>

              {/* Navigation étape 2 */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2.5 rounded-xl bg-[#1E1E1E] hover:bg-[#282828] text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Retour</span>
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canGoToStep3()}
                  className="px-6 py-2.5 rounded-xl bg-[#FFBF00] hover:bg-[#E6AC00] text-black font-bold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span>Étape suivante : Coordonnées</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ÉTAPE 3 : RÉCAPITULATIF & COORDONNÉES DE CONTACT                          */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
              <div>
                <h3 className="text-sm font-bold text-white mb-0.5">Vos coordonnées & Récapitulatif</h3>
                <p className="text-xs text-[#8E8E8E]">
                  Indiquez qui contacter pour valider la disponibilité et finaliser la réservation.
                </p>
              </div>

              {/* Bloc récapitulatif synthétique */}
              <div className="p-4 rounded-2xl bg-[#161616] border border-[#262626] space-y-2 text-xs">
                <div className="flex items-center justify-between text-[#AAA]">
                  <span>Prestation choisie :</span>
                  <strong className="text-white font-semibold">
                    {NEED_OPTIONS.find((n) => n.type === selectedNeed)?.title}
                  </strong>
                </div>

                {preferredDate && (
                  <div className="flex items-center justify-between text-[#AAA]">
                    <span>Date & Créneau :</span>
                    <span className="text-white">
                      {new Date(preferredDate).toLocaleDateString("fr-FR", {
                        weekday: "short",
                        day: "numeric",
                        month: "long",
                      })}{" "}
                      — {TIME_SLOTS.find((s) => s.id === timeSlot)?.label.split("(")[0]}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[#AAA]">
                  <span>Estimation tarifaire :</span>
                  <strong className="text-[#FFBF00] font-bold">{estimatedPricing}</strong>
                </div>
              </div>

              {/* Message d'aide préremplissage si connecté */}
              {isAuthenticated && user && (
                <div className="px-3 py-2 rounded-xl bg-[#1C1C1C] border border-[#2C2C2C] flex items-center justify-between text-xs text-[#8E8E8E]">
                  <span>Coordonnées préremplies depuis votre compte</span>
                  <span className="text-[#FFBF00] text-[11px] font-semibold">Connecté</span>
                </div>
              )}

              {/* Champs de contact distincts */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#CCC]">
                      Nom et prénom du contact <span className="text-[#FFBF00]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Cheick Diallo"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full bg-[#181818] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs text-white placeholder-[#606060] outline-none focus:border-[#FFBF00] transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#CCC]">
                      Nom de l'émission / podcast <span className="text-[#666]">(Optionnel)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Les Voix du Sahel"
                      value={podcastName}
                      onChange={(e) => setPodcastName(e.target.value)}
                      className="w-full bg-[#181818] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs text-white placeholder-[#606060] outline-none focus:border-[#FFBF00] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#CCC]">
                      Adresse Email <span className="text-[#FFBF00]">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="contact@exemple.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#181818] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs text-white placeholder-[#606060] outline-none focus:border-[#FFBF00] transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#CCC]">
                      Entreprise / Organisation <span className="text-[#666]">(Optionnel)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Studio Mali Media, Indépendant..."
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full bg-[#181818] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs text-white placeholder-[#606060] outline-none focus:border-[#FFBF00] transition-colors"
                    />
                  </div>
                </div>

                {/* Téléphone avec sélecteur d'indicatif international */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#CCC]">
                    Numéro Téléphone / WhatsApp <span className="text-[#FFBF00]">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-40 bg-[#181818] border border-[#2E2E2E] rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-[#FFBF00] transition-colors shrink-0"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>

                    <input
                      type="tel"
                      required
                      placeholder="66 00 00 00"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="flex-1 bg-[#181818] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs text-white placeholder-[#606060] outline-none focus:border-[#FFBF00] transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Mention transparente de non-facturation immédiate */}
              <div className="p-3 bg-[#181818] border border-[#262626] rounded-xl text-[11px] text-[#888] leading-relaxed">
                ℹ️ <strong>Processus de validation :</strong> L'envoi de cette demande ne constitue pas un paiement immédiat. Notre équipe technique vérifie la disponibilité effective du studio physique et vous confirme le créneau par WhatsApp ou appel dans un délai de 24 heures.
              </div>

              {/* Actions de validation */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2.5 rounded-xl bg-[#1E1E1E] hover:bg-[#282828] text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Retour</span>
                </button>

                <button
                  type="submit"
                  disabled={!canSubmit() || isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#FFBF00] hover:bg-[#E6AC00] text-black font-black text-xs transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Envoi de votre demande..." : "Envoyer ma demande de session"}</span>
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* ÉTAPE 4 : CONFIRMATION RÉELLE DU SERVEUR                                  */}
          {/* ========================================================================= */}
          {currentStep === 4 && createdBooking && (
            <div className="py-6 text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Demande reçue — En attente de confirmation
                </span>
                <h3 className="text-xl font-bold text-white">Merci pour votre confiance !</h3>
                <p className="text-xs text-[#8E8E8E] max-w-md mx-auto leading-relaxed">
                  Votre demande pour <strong className="text-white font-medium">{contactName}</strong> a été enregistrée avec succès. Notre régisseur étudie votre dossier pour réserver votre session physique.
                </p>
              </div>

              {/* Récapitulatif ticket réel */}
              <div className="bg-[#161616] border border-[#262626] rounded-2xl p-4 text-left text-xs space-y-2 max-w-md mx-auto">
                <div className="flex items-center justify-between text-[#8E8E8E]">
                  <span>Référence de dossier :</span>
                  <span className="font-mono text-[#FFBF00] font-bold">{createdBooking.reference}</span>
                </div>
                <div className="flex items-center justify-between text-[#8E8E8E]">
                  <span>Statut :</span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 font-semibold text-[11px]">
                    En cours d'examen
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#8E8E8E]">
                  <span>Service demandé :</span>
                  <span className="text-white font-medium">
                    {NEED_OPTIONS.find((n) => n.type === createdBooking.needType)?.title}
                  </span>
                </div>
                {createdBooking.preferredDate && (
                  <div className="flex items-center justify-between text-[#8E8E8E]">
                    <span>Date souhaitée :</span>
                    <span className="text-white font-medium">{createdBooking.preferredDate}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-[#8E8E8E]">
                  <span>Contact WhatsApp :</span>
                  <span className="text-white font-medium">{createdBooking.countryCode} {createdBooking.phone}</span>
                </div>
              </div>

              <div className="pt-3 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={handleCloseAndReset}
                  className="px-6 py-2.5 rounded-xl bg-[#FFBF00] hover:bg-[#E6AC00] text-black font-bold text-xs transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ClientPortal>
  );
}
