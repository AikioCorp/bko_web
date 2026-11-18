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
import { backdropPointerDown, useEscapeDismiss } from "@/hooks/useModalDismiss";
import { StudioDatePicker, formatDateFr, isWeekendIsoDate } from "@/components/ui/StudioDatePicker";
import {
  PHONE_COUNTRIES,
  formatPhoneForCountry,
  getCountryRule,
  isPhoneValidForCountry,
  extractDigits,
} from "@/lib/phone";

const STUDIO_WHATSAPP_NUMBER = "22370000000";
const STUDIO_CONTACT_EMAIL = "studio@bamakopodcast.studio";

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

function matchSpaceIdFromLabel(label: string): string {
  const lower = label.toLowerCase();
  if (lower.includes("vip")) return "SALLE_VIP";
  if (lower.includes("conférence") || lower.includes("conference")) return "SALLE_CONFERENCE";
  if (lower.includes("extérieur") || lower.includes("exterieur")) return "EXTERIEUR";
  if (lower.includes("distanciel") || lower.includes("distance")) return "DISTANCIEL";
  return "STUDIO_PRINCIPAL";
}

function parseFcfaAmount(priceText?: string | null): number {
  if (!priceText) return 0;
  const match = priceText.replace(/\s/g, "").match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

function extractSpaceRatesFromOffer(offer: any): Record<string, { hourly: number; label: string }> {
  const rates: Record<string, { hourly: number; label: string }> = {};
  if (!offer || !Array.isArray(offer.features)) return rates;
  for (const feat of offer.features) {
    if (typeof feat === "string" && feat.includes(" : ")) {
      const [rawLabel, rawPrice] = feat.split(" : ");
      const spaceId = matchSpaceIdFromLabel(rawLabel);
      const hourly = parseFcfaAmount(rawPrice);
      if (hourly > 0) {
        rates[spaceId] = { hourly, label: rawPrice.trim() };
      }
    }
  }
  return rates;
}

const TELEPROMPTER_MIN_PRICE = 7500;

const TIME_SLOTS = [
  {
    id: "MATIN",
    label: "Matin (09h00 — 12h00)",
    short: "09h00 — 12h00",
    hours: ["09h00", "10h00", "11h00"],
  },
  {
    id: "MIDI",
    label: "Milieu de journée (12h00 — 15h00)",
    short: "12h00 — 15h00",
    hours: ["12h00", "13h00", "14h00"],
  },
  {
    id: "APRES_MIDI",
    label: "Après-midi (15h00 — 18h00)",
    short: "15h00 — 18h00",
    hours: ["15h00", "16h00", "17h00"],
  },
  {
    id: "JOURNEE",
    label: "Journée complète (09h00 — 18h00)",
    short: "09h00 — 18h00",
    hours: ["09h00"],
  },
  {
    id: "ACCORD_COMMUN",
    label: "Autre horaire / Soirée (sur accord commun)",
    short: "Sur accord commun",
    hours: ["Sur accord commun"],
  },
];

const STUDIO_START_HOURS = [
  "09h00",
  "10h00",
  "11h00",
  "12h00",
  "13h00",
  "14h00",
  "15h00",
  "16h00",
  "17h00",
];

function slotIdForHour(hour: string): string {
  const num = parseInt(hour.slice(0, 2), 10);
  if (num < 12) return "MATIN";
  if (num < 15) return "MIDI";
  return "APRES_MIDI";
}

const STUDIO_LOCATIONS = [
  { id: "STUDIO_PRINCIPAL", title: "Studio Principal / Annexe", label: "Studio Principal (1 à 4 micros, acoustique broadcast)" },
  { id: "SALLE_CONFERENCE", title: "Salle de Conférence", label: "Salle de Conférence (Table ronde jusqu'à 8 intervenants)" },
  { id: "SALLE_VIP", title: "Salle VIP", label: "Espace Salon VIP (Ambiance feutrée, fauteuils club)" },
  { id: "EXTERIEUR", title: "Extérieur (Bamako)", label: "Déplacement / Tournage extérieur à Bamako" },
  { id: "DISTANCIEL", title: "À distance", label: "À distance / 100% en ligne (pour montage & coaching)" },
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
  const [preferredHour, setPreferredHour] = useState<string>("09h00");
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
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

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
              setPhone(formatPhoneForCountry(parts.slice(1).join(""), parts[0]));
            } else {
              setPhone(formatPhoneForCountry(cleanPhone, "+223"));
            }
          } else {
            setPhone(formatPhoneForCountry(cleanPhone, "+223"));
          }
        }
      }

      // Pré-sélection basée sur preselectedService (Besoin + Offre + Espace)
      if (preselectedService) {
        const s = preselectedService.toLowerCase();
        if (s.includes("express") || s.includes("vidéo") || s.includes("video")) {
          setSelectedNeed("VIDEO_PODCAST");
          const expressOffer = serverOffers.find((o) =>
            o.name.toLowerCase().includes("express")
          );
          if (expressOffer) setSelectedOfferId(expressOffer.id);
        } else if (s.includes("montage") || s.includes("post-production")) {
          setSelectedNeed("EDITING");
          setSelectedOfferId("");
        } else if (s.includes("short") || s.includes("reel") || s.includes("extrait")) {
          setSelectedNeed("SNIPPETS");
          setSelectedOfferId("");
        } else if (s.includes("coach") || s.includes("accompagnement")) {
          setSelectedNeed("COACHING");
          setSelectedOfferId("");
        } else if (s.includes("sur mesure")) {
          setSelectedNeed("CUSTOM");
          setSelectedOfferId("");
        } else {
          setSelectedNeed("AUDIO_PODCAST");
          const brutOffer = serverOffers.find((o) =>
            o.name.toLowerCase().includes("brut")
          );
          if (brutOffer) setSelectedOfferId(brutOffer.id);
        }

        if (s.includes("vip")) {
          setStudioLocation("SALLE_VIP");
        } else if (s.includes("conférence") || s.includes("conference")) {
          setStudioLocation("SALLE_CONFERENCE");
        } else if (s.includes("extérieur") || s.includes("exterieur")) {
          setStudioLocation("EXTERIEUR");
        } else if (s.includes("distanciel") || s.includes("distance")) {
          setStudioLocation("DISTANCIEL");
        } else if (s.includes("principal") || s.includes("annexe")) {
          setStudioLocation("STUDIO_PRINCIPAL");
        }
      }
    }
  }, [isOpen, preselectedService, isAuthenticated, user, serverOffers]);

  // Vérifier les créneaux déjà réservés quand la date ou l'espace change
  useEffect(() => {
    if (!isOpen || !preferredDate) {
      setBookedSlots([]);
      return;
    }
    let active = true;
    setLoadingAvailability(true);
    fetchApi(
      `/studio/bookings/availability?date=${encodeURIComponent(
        preferredDate
      )}&studioLocation=${encodeURIComponent(studioLocation)}`
    )
      .then((res) => {
        if (!active) return;
        const booked: string[] = Array.isArray(res?.data?.bookedSlots)
          ? res.data.bookedSlots
          : [];
        setBookedSlots(booked);
        if (booked.includes(timeSlot)) {
          const firstAvailable = TIME_SLOTS.find((slot) => !booked.includes(slot.id));
          if (firstAvailable) {
            setTimeSlot(firstAvailable.id);
            setPreferredHour(firstAvailable.hours[0]);
          }
        }
      })
      .catch(() => {
        if (active) setBookedSlots([]);
      })
      .finally(() => {
        if (active) setLoadingAvailability(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, preferredDate, studioLocation]);

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

  // Tarifs horaires par espace extraits dynamiquement de l'offre sélectionnée
  const spaceRatesMap = useMemo(() => {
    return extractSpaceRatesFromOffer(currentMatchingOffer);
  }, [currentMatchingOffer]);

  // Estimation tarifaire indicative dynamique (tient compte de la formule, de l'espace et des options)
  const estimatedPricing = useMemo(() => {
    if (selectedNeed === "CUSTOM") {
      return "Sur devis personnalisé";
    }
    const selectedShootingOptions = shootingNeeds.split(",").filter(Boolean);
    const hasTeleprompter =
      selectedNeed === "VIDEO_PODCAST" && selectedShootingOptions.includes("PROMPTER");
    const teleprompterCost = hasTeleprompter ? TELEPROMPTER_MIN_PRICE : 0;

    if (currentMatchingOffer) {
      if (selectedNeed === "AUDIO_PODCAST" || selectedNeed === "VIDEO_PODCAST") {
        const spaceRate = spaceRatesMap[studioLocation]?.hourly;
        const base =
          spaceRate ||
          parseFcfaAmount(currentMatchingOffer.price) ||
          (selectedNeed === "VIDEO_PODCAST" ? 35000 : 20000);
        const total = base * durationHours + teleprompterCost;
        return `${total.toLocaleString("fr-FR")} FCFA (${durationHours}h • ${
          base.toLocaleString("fr-FR")
        } FCFA/h${hasTeleprompter ? " + Téléprompteur dès 7 500 FCFA" : ""})`;
      }
      if (selectedNeed === "SNIPPETS") {
        const base = parseFcfaAmount(currentMatchingOffer.price) || 15000;
        const packs = Math.ceil(snippetsCount / 3);
        return `${(base * packs).toLocaleString("fr-FR")} FCFA (${snippetsCount} extraits)`;
      }
      return `${currentMatchingOffer.price} ${currentMatchingOffer.unit || "FCFA"}`;
    }
    if (hasTeleprompter) {
      return `À partir de ${TELEPROMPTER_MIN_PRICE.toLocaleString("fr-FR")} FCFA (Téléprompteur inclus)`;
    }
    return "Estimation fournie par l'équipe";
  }, [
    selectedNeed,
    currentMatchingOffer,
    spaceRatesMap,
    studioLocation,
    durationHours,
    snippetsCount,
    shootingNeeds,
  ]);

  useEscapeDismiss(isOpen, onClose, !isSubmitting);

  if (!isOpen) return null;

  // Validation par étape
  const canGoToStep2 = () => Boolean(selectedNeed);
  const canGoToStep3 = () => {
    if (selectedNeed === "AUDIO_PODCAST" || selectedNeed === "VIDEO_PODCAST") {
      return Boolean(preferredDate && timeSlot && !bookedSlots.includes(timeSlot) && durationHours > 0);
    }
    if (selectedNeed === "EDITING") {
      return Boolean(mediaFilesUrl.trim() || notes.trim());
    }
    return true;
  };
  const canSubmit = () => {
    return Boolean(
      contactName.trim() &&
        email.trim() &&
        isPhoneValidForCountry(phone, countryCode)
    );
  };

  const isCommonAgreement =
    isWeekendIsoDate(preferredDate) ||
    timeSlot === "ACCORD_COMMUN" ||
    preferredHour === "Sur accord commun";

  const buildExternalSummaryText = (reference?: string) => {
    const needTitle = NEED_OPTIONS.find((n) => n.type === selectedNeed)?.title || selectedNeed;
    const offerName = currentMatchingOffer?.name || "Sur mesure";
    const spaceTitle =
      STUDIO_LOCATIONS.find((l) => l.id === studioLocation)?.title || studioLocation;
    const slotLabel = TIME_SLOTS.find((s) => s.id === timeSlot)?.label || timeSlot;
    const agreementTag = isCommonAgreement ? " (Sur accord commun)" : "";
    const lines = [
      `Bonjour Bamako Podcast, voici ma demande de réservation studio :`,
      reference ? `• Référence : ${reference}` : null,
      `• Prestation : ${needTitle} (${offerName})`,
      preferredDate ? `• Date : ${formatDateFr(preferredDate)}${isWeekendIsoDate(preferredDate) ? " (Week-end — sur accord commun)" : ""}` : null,
      (selectedNeed === "AUDIO_PODCAST" || selectedNeed === "VIDEO_PODCAST")
        ? `• Créneau : ${slotLabel} • Heure de début : ${preferredHour}${agreementTag}`
        : null,
      (selectedNeed === "AUDIO_PODCAST" || selectedNeed === "VIDEO_PODCAST")
        ? `• Durée : ${durationHours}h | Participants : ${participantsCount}`
        : null,
      (selectedNeed === "AUDIO_PODCAST" || selectedNeed === "VIDEO_PODCAST")
        ? `• Espace : ${spaceTitle}`
        : null,
      `• Estimation : ${estimatedPricing}`,
      `• Nom : ${contactName.trim()}`,
      podcastName.trim() ? `• Émission : ${podcastName.trim()}` : null,
      `• Téléphone : ${countryCode} ${phone.trim()}`,
      `• Email : ${email.trim()}`,
      notes.trim() ? `• Notes : ${notes.trim()}` : null,
    ].filter(Boolean);
    return lines.join("\n");
  };

  const submitBookingWithChannel = async (channel: "EMAIL" | "WHATSAPP") => {
    if (!canSubmit()) {
      const rule = getCountryRule(countryCode);
      setSubmitError(
        `Veuillez renseigner votre nom, email valide et un numéro ${rule.name} valide (${rule.minDigits} chiffres, ex: ${rule.placeholder}).`
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const isAudioOrVideo =
        selectedNeed === "AUDIO_PODCAST" || selectedNeed === "VIDEO_PODCAST";
      const composedNotes = [
        isAudioOrVideo ? `[Heure de début souhaitée : ${preferredHour}]` : null,
        isAudioOrVideo && isCommonAgreement
          ? "[Demande hors ouverture standard — à valider sur accord commun avec le studio]"
          : null,
        notes.trim() || null,
      ]
        .filter(Boolean)
        .join("\n");

      const payload = {
        needType: selectedNeed,
        offerId: currentMatchingOffer?.id || undefined,
        contactName: contactName.trim(),
        podcastName: podcastName.trim() || undefined,
        company: company.trim() || undefined,
        email: email.trim(),
        phone: extractDigits(phone),
        countryCode,
        preferredDate: preferredDate || undefined,
        timeSlot: timeSlot || undefined,
        durationHours: isAudioOrVideo ? durationHours : undefined,
        participantsCount: isAudioOrVideo ? participantsCount : undefined,
        studioLocation: isAudioOrVideo ? studioLocation : undefined,
        shootingNeeds: selectedNeed === "VIDEO_PODCAST" ? shootingNeeds : undefined,
        mediaFilesUrl: selectedNeed === "EDITING" || selectedNeed === "SNIPPETS" ? mediaFilesUrl : undefined,
        targetDeadline: targetDeadline || undefined,
        expectedResult: expectedResult || undefined,
        snippetsCount: selectedNeed === "SNIPPETS" ? snippetsCount : undefined,
        aspectRatios: selectedNeed === "SNIPPETS" ? aspectRatios : undefined,
        subtitlesNeeded: selectedNeed === "SNIPPETS" ? subtitlesNeeded : undefined,
        coachingGoal: selectedNeed === "COACHING" ? coachingGoal : undefined,
        projectStage: selectedNeed === "COACHING" ? projectStage : undefined,
        notes: composedNotes || undefined,
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

      if (channel === "WHATSAPP") {
        const msg = buildExternalSummaryText(res.data.reference);
        window.open(
          `https://wa.me/${STUDIO_WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,
          "_blank",
          "noopener,noreferrer"
        );
      }
    } catch (err: any) {
      setSubmitError(err.message || "Une erreur est survenue lors de l'enregistrement de votre demande.");
    } finally {
      setIsSubmitting(false);
    }
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
    await submitBookingWithChannel("EMAIL");
  };

  const handleCloseAndReset = () => {
    setCurrentStep(1);
    setSubmitError("");
    setCreatedBooking(null);
    onClose();
  };

  return (
    <ClientPortal>
      <div
        onPointerDown={backdropPointerDown(handleCloseAndReset, !isSubmitting)}
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in select-none overflow-y-auto"
      >
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
                  {/* Sélecteur de formule dynamique (Brut vs Express) */}
                  {serverOffers.filter((o) => o.type === "PACKAGE").length > 0 && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#CCC]">Formule de captation</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {serverOffers
                          .filter((o) => o.type === "PACKAGE")
                          .map((pkg) => {
                            const active = currentMatchingOffer?.id === pkg.id;
                            return (
                              <button
                                key={pkg.id}
                                type="button"
                                onClick={() => {
                                  setSelectedOfferId(pkg.id);
                                  if (pkg.name.toLowerCase().includes("express")) {
                                    setSelectedNeed("VIDEO_PODCAST");
                                  } else {
                                    setSelectedNeed("AUDIO_PODCAST");
                                  }
                                }}
                                className={`p-3 rounded-xl border text-left transition-colors flex items-center justify-between gap-2 ${
                                  active
                                    ? "bg-[#1C1810] border-[#FFBF00] text-white"
                                    : "bg-[#181818] border-[#2E2E2E] text-[#AAA] hover:border-[#444]"
                                }`}
                              >
                                <span className="text-xs font-bold truncate">{pkg.name}</span>
                                <span className="text-[11px] font-mono font-bold text-[#FFBF00] shrink-0">
                                  Dès {pkg.price} {pkg.unit || "FCFA"}
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Date souhaitée (Calendrier custom Lundi au Vendredi + week-end sur accord commun) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#CCC] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#FFBF00]" />
                      <span>Date souhaitée (Lun — Ven en standard) *</span>
                    </label>
                    <StudioDatePicker
                      value={preferredDate}
                      onChange={(iso) => setPreferredDate(iso)}
                    />
                  </div>

                  {/* Créneau horaire (09h00 - 18h00) avec disponibilité temps réel */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#CCC] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#FFBF00]" />
                        <span>Créneau horaire (09h00 — 18h00 en standard) *</span>
                      </label>
                      {loadingAvailability && (
                        <span className="text-[10px] text-[#FFBF00]">Vérification des disponibilités...</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {TIME_SLOTS.map((slot) => {
                        const isBooked = bookedSlots.includes(slot.id);
                        const isSelected = timeSlot === slot.id && !isBooked;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={isBooked}
                            onClick={() => {
                              setTimeSlot(slot.id);
                              if (!slot.hours.includes(preferredHour)) {
                                setPreferredHour(slot.hours[0]);
                              }
                            }}
                            className={`px-3 py-2.5 rounded-xl border text-left text-xs transition-colors flex items-center justify-between gap-2 ${
                              isBooked
                                ? "bg-[#141414] border-[#222222] text-[#555555] cursor-not-allowed line-through"
                                : isSelected
                                ? "bg-[#1C1810] border-[#FFBF00] text-white font-bold"
                                : "bg-[#181818] border-[#2E2E2E] text-[#CCCCCC] hover:border-[#444]"
                            }`}
                          >
                            <span className="truncate">{slot.label}</span>
                            {isBooked && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-900/50 no-underline shrink-0">
                                Réservé
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Sélection d'heure précise entre 09h00 et 18h00 + option accord commun */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-[#AAA]">
                          Heure de début souhaitée (09h00 — 18h00)
                        </span>
                        <span className="text-[10px] text-[#777]">Fin max standard : 18h00</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {STUDIO_START_HOURS.map((hour) => {
                          const mappedSlot = slotIdForHour(hour);
                          const isBooked =
                            bookedSlots.includes(mappedSlot) ||
                            bookedSlots.includes("JOURNEE");
                          const isSelected = preferredHour === hour && !isBooked;
                          return (
                            <button
                              key={hour}
                              type="button"
                              disabled={isBooked}
                              onClick={() => {
                                setPreferredHour(hour);
                                if (timeSlot !== "JOURNEE") {
                                  setTimeSlot(mappedSlot);
                                }
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                                isBooked
                                  ? "bg-[#141414] border-[#222222] text-[#4A4A4A] cursor-not-allowed line-through"
                                  : isSelected
                                  ? "bg-[#FFBF00] text-black border-[#FFBF00]"
                                  : "bg-[#181818] text-[#CCCCCC] border-[#2E2E2E] hover:border-[#444]"
                              }`}
                            >
                              {hour}
                            </button>
                          );
                        })}

                        <button
                          type="button"
                          onClick={() => {
                            setTimeSlot("ACCORD_COMMUN");
                            setPreferredHour("Sur accord commun");
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                            preferredHour === "Sur accord commun" || timeSlot === "ACCORD_COMMUN"
                              ? "bg-[#FFBF00] text-black border-[#FFBF00]"
                              : "bg-[#181818] text-amber-300 border-dashed border-amber-500/40 hover:border-amber-400"
                          }`}
                        >
                          Autre heure (sur accord commun)
                        </button>
                      </div>

                      <p className="text-[10px] text-[#8E8E8E]">
                        Ouverture standard : Lundi au Vendredi de 09h00 à 18h00. Les autres jours ou heures doivent faire l&apos;objet d&apos;un accord commun.
                      </p>

                      {isCommonAgreement && (
                        <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-300">
                          Demande hors plage standard : ce jour ou cet horaire fera l&apos;objet d&apos;un accord commun avec notre régisseur (précisez votre horaire idéal dans les notes ci-dessous si besoin).
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Durée & Participants */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#CCC] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#FFBF00]" />
                        <span>Durée de la session</span>
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { v: 1, l: "1h" },
                          { v: 2, l: "2h (Reco)" },
                          { v: 3, l: "3h" },
                          { v: 4, l: "4h" },
                          { v: 8, l: "8h" },
                        ].map((d) => (
                          <button
                            key={d.v}
                            type="button"
                            onClick={() => setDurationHours(d.v)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                              durationHours === d.v
                                ? "bg-[#FFBF00] text-black border-[#FFBF00]"
                                : "bg-[#181818] text-[#CCC] border-[#2E2E2E] hover:border-[#444]"
                            }`}
                          >
                            {d.l}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#CCC] flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#FFBF00]" />
                        <span>Participants autour du micro</span>
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { v: 1, l: "1 (Solo)" },
                          { v: 2, l: "2" },
                          { v: 3, l: "3" },
                          { v: 4, l: "4" },
                          { v: 6, l: "5-6" },
                          { v: 8, l: "6+" },
                        ].map((p) => (
                          <button
                            key={p.v}
                            type="button"
                            onClick={() => setParticipantsCount(p.v)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                              participantsCount === p.v
                                ? "bg-[#FFBF00] text-black border-[#FFBF00]"
                                : "bg-[#181818] text-[#CCC] border-[#2E2E2E] hover:border-[#444]"
                            }`}
                          >
                            {p.l}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Espace de tournage avec tarif horaire exact */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#CCC] flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#FFBF00]" />
                      <span>Espace de tournage souhaité</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {STUDIO_LOCATIONS.filter((l) => l.id !== "DISTANCIEL").map((loc) => {
                        const rateInfo = spaceRatesMap[loc.id];
                        const isSelected = studioLocation === loc.id;
                        return (
                          <button
                            key={loc.id}
                            type="button"
                            onClick={() => setStudioLocation(loc.id)}
                            className={`p-3 rounded-xl border text-left transition-colors flex items-center justify-between gap-2 ${
                              isSelected
                                ? "bg-[#1C1810] border-[#FFBF00] text-white"
                                : "bg-[#181818] border-[#2E2E2E] text-[#CCC] hover:border-[#444]"
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate">{loc.title}</p>
                              <p className="text-[10px] text-[#888] truncate">{loc.label}</p>
                            </div>
                            {rateInfo && (
                              <span className="text-[11px] font-mono font-bold text-[#FFBF00] shrink-0">
                                {rateInfo.hourly.toLocaleString("fr-FR")} F/h
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Estimation live visible dès l'étape 2 */}
                  <div className="p-3 rounded-xl bg-[#161616] border border-[#2A2A2A] flex items-center justify-between text-xs">
                    <span className="text-[#AAA]">Estimation en direct :</span>
                    <strong className="text-[#FFBF00] font-bold">{estimatedPricing}</strong>
                  </div>

                  {selectedNeed === "VIDEO_PODCAST" && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#CCC]">Besoins spécifiques de captation</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {[
                          { id: "MULTI_CAM", label: "Multi-caméras 4K avec réalisation en direct" },
                          {
                            id: "PROMPTER",
                            label: "Téléprompteur professionnel",
                            priceBadge: "À partir de 7 500 FCFA",
                          },
                          { id: "CUSTOM_BRANDING", label: "Incrustation de logo et habillage graphique live" },
                          { id: "RAW_FOOTAGE", label: "Livraison des rushs bruts séparés sur disque" },
                        ].map((b) => {
                          const isChecked = shootingNeeds.split(",").filter(Boolean).includes(b.id);
                          return (
                            <label
                              key={b.id}
                              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                                isChecked
                                  ? "bg-[#1C1810] border-[#FFBF00]/70"
                                  : "bg-[#181818] border-[#282828] hover:border-[#3A3A3A]"
                              }`}
                            >
                              <span className="flex items-center gap-2 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setShootingNeeds((prev) =>
                                        prev ? `${prev},${b.id}` : b.id
                                      );
                                    } else {
                                      setShootingNeeds((prev) =>
                                        prev
                                          .split(",")
                                          .filter((x) => x !== b.id)
                                          .join(",")
                                      );
                                    }
                                  }}
                                  className="accent-[#FFBF00] shrink-0"
                                />
                                <span className="text-[#DDD] text-[11px]">{b.label}</span>
                              </span>
                              {"priceBadge" in b && b.priceBadge && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#222222] text-[#FFBF00] border border-[#FFBF00]/30 shrink-0 whitespace-nowrap">
                                  {b.priceBadge}
                                </span>
                              )}
                            </label>
                          );
                        })}
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
                  <div className="flex items-center justify-between gap-2 text-[#AAA]">
                    <span>Date & Créneau :</span>
                    <span className="text-white text-right">
                      <span className="capitalize">{formatDateFr(preferredDate)}</span> —{" "}
                      {TIME_SLOTS.find((s) => s.id === timeSlot)?.label.split("(")[0].trim()}
                      {preferredHour !== "Sur accord commun" ? ` • ${preferredHour}` : ""}
                      {isCommonAgreement && (
                        <span className="ml-1.5 text-amber-300 font-semibold">(Sur accord commun)</span>
                      )}
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

                {/* Téléphone avec sélecteur d'indicatif international & formatage strict par pays */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#CCC]">
                      Numéro Téléphone / WhatsApp <span className="text-[#FFBF00]">*</span>
                    </label>
                    <span className="text-[10px] text-[#888]">
                      Format {getCountryRule(countryCode).name} : {getCountryRule(countryCode).maxDigits} chiffres max
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => {
                        const nextDial = e.target.value;
                        setCountryCode(nextDial);
                        setPhone((prev) => formatPhoneForCountry(prev, nextDial));
                      }}
                      className="w-44 bg-[#181818] border border-[#2E2E2E] rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-[#FFBF00] transition-colors shrink-0"
                    >
                      {PHONE_COUNTRIES.map((c) => (
                        <option key={c.code} value={c.dial}>
                          {c.label}
                        </option>
                      ))}
                    </select>

                    <input
                      type="tel"
                      inputMode="numeric"
                      required
                      placeholder={getCountryRule(countryCode).placeholder}
                      value={phone}
                      onChange={(e) => setPhone(formatPhoneForCountry(e.target.value, countryCode))}
                      className="flex-1 bg-[#181818] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs text-white placeholder-[#606060] outline-none focus:border-[#FFBF00] transition-colors font-mono"
                    />
                  </div>
                  {phone && !isPhoneValidForCountry(phone, countryCode) && (
                    <p className="text-[11px] text-amber-400">
                      Veuillez saisir {getCountryRule(countryCode).minDigits} chiffres pour {getCountryRule(countryCode).name} (ex: {getCountryRule(countryCode).placeholder}).
                    </p>
                  )}
                </div>
              </div>

              {/* Mention transparente de non-facturation immédiate */}
              <div className="p-3 bg-[#181818] border border-[#262626] rounded-xl text-[11px] text-[#888] leading-relaxed">
                ℹ️ <strong>Processus de validation :</strong> L'envoi de cette demande ne constitue pas un paiement immédiat. Notre équipe technique vérifie la disponibilité effective du studio physique et vous confirme le créneau par WhatsApp ou Email dans un délai de 24 heures.
              </div>

              {/* Actions de validation : Email / Plateforme ou WhatsApp */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2.5 rounded-xl bg-[#1E1E1E] hover:bg-[#282828] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Retour</span>
                </button>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <button
                    type="button"
                    disabled={!canSubmit() || isSubmitting}
                    onClick={() => submitBookingWithChannel("WHATSAPP")}
                    className="px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-black font-black text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Réserver via WhatsApp</span>
                  </button>

                  <button
                    type="submit"
                    disabled={!canSubmit() || isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-[#FFBF00] hover:bg-[#E6AC00] text-black font-black text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? "Envoi..." : "Réserver par Email / Plateforme"}</span>
                  </button>
                </div>
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
                  Demande reçue — Créneau pré-réservé
                </span>
                <h3 className="text-xl font-bold text-white">Merci pour votre confiance !</h3>
                <p className="text-xs text-[#8E8E8E] max-w-md mx-auto leading-relaxed">
                  Votre demande pour <strong className="text-white font-medium">{contactName}</strong> a été enregistrée avec succès. Notre régisseur vous contactera très rapidement.
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
                {createdBooking.studioLocation && (
                  <div className="flex items-center justify-between text-[#8E8E8E]">
                    <span>Espace :</span>
                    <span className="text-white font-medium">
                      {STUDIO_LOCATIONS.find((l) => l.id === createdBooking.studioLocation)?.title || createdBooking.studioLocation}
                    </span>
                  </div>
                )}
                {createdBooking.preferredDate && (
                  <div className="flex items-center justify-between text-[#8E8E8E]">
                    <span>Date souhaitée :</span>
                    <span className="text-white font-medium capitalize">{formatDateFr(createdBooking.preferredDate) || createdBooking.preferredDate}</span>
                  </div>
                )}
                {createdBooking.estimatedPrice && (
                  <div className="flex items-center justify-between text-[#8E8E8E]">
                    <span>Tarif estimé :</span>
                    <span className="text-[#FFBF00] font-bold">{createdBooking.estimatedPrice}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-[#8E8E8E]">
                  <span>Contact WhatsApp :</span>
                  <span className="text-white font-medium">
                    {createdBooking.countryCode} {formatPhoneForCountry(createdBooking.phone, createdBooking.countryCode || "+223")}
                  </span>
                </div>
              </div>

              <div className="pt-3 flex flex-wrap justify-center gap-2.5">
                <a
                  href={`https://wa.me/${STUDIO_WHATSAPP_NUMBER}?text=${encodeURIComponent(buildExternalSummaryText(createdBooking.reference))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-black font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Envoyer sur WhatsApp</span>
                </a>
                <a
                  href={`mailto:${STUDIO_CONTACT_EMAIL}?subject=${encodeURIComponent(`Réservation Studio ${createdBooking.reference}`)}&body=${encodeURIComponent(buildExternalSummaryText(createdBooking.reference))}`}
                  className="px-4 py-2.5 rounded-xl bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#333] text-white font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-[#FFBF00]" />
                  <span>Envoyer par Email</span>
                </a>
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
