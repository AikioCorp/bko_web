"use client";

import React, { useState, useMemo } from "react";
import useSWR from "swr";
import { fetchApi } from "@/lib/api";
import {
  Check,
  Mic,
  Video,
  Edit3,
  Share2,
  Headphones,
  Sparkles,
  Phone,
  ShieldCheck,
  Clock,
  Layers,
  ChevronDown,
  ArrowRight,
  Radio,
  Building2,
  Users2,
  Crown,
  Trees,
  Loader2
} from "lucide-react";
import { StudioBookingModal } from "@/components/modals/StudioBookingModal";

// Données de secours fiables si l'API est en cours de chargement ou hors ligne
const FALLBACK_OFFERS = [
  {
    id: "fallback-brut",
    type: "PACKAGE",
    name: "Enregistrement Brut",
    price: "20 000",
    unit: "FCFA / h",
    description: "Pour ceux qui souhaitent récupérer leurs fichiers audio et vidéo afin de réaliser leur propre montage.",
    features: [
      "Studio Principal / Annexe : 20 000 FCFA / h",
      "Salle de Conférence : 25 000 FCFA / h",
      "Salle VIP : 25 000 FCFA / h",
      "Extérieur : 60 000 FCFA / h",
      "Fichiers audio bruts WAV & vidéo MP4 (Full HD / 4K) remis immédiatement",
      "Micros Shure SM7B broadcast & cabine insonorisée",
      "Ingénieur du son dédié pour le monitoring et la prise de voix",
    ],
    isPopular: false,
    iconName: "raw",
    isActive: true,
    order: 1,
  },
  {
    id: "fallback-express",
    type: "PACKAGE",
    name: "Formule Express",
    price: "35 000",
    unit: "FCFA / h",
    description: "Une captation dynamique avec plusieurs angles de vue et une réalisation en direct. Repartez avec une vidéo prête à être diffusée dès la fin de votre session.",
    features: [
      "Studio Principal / Annexe : 35 000 FCFA / h",
      "Salle de Conférence : 40 000 FCFA / h",
      "Salle VIP : 50 000 FCFA / h",
      "Réalisation multi-caméras en direct (commutation live des plans)",
      "Vidéo finalisée et exportée prête à publier dès la fin de votre session",
      "Habillage visuel personnalisé (logos, synthés, titres des invités)",
      "Mastering et mixage son professionnel en temps réel",
    ],
    isPopular: true,
    iconName: "express",
    isActive: true,
    order: 2,
  },
  {
    id: "fallback-service-1",
    type: "SERVICE",
    name: "Montage & Post-production complète",
    price: "25 000",
    unit: "FCFA / épisode",
    description: "Dérushage, découpe des hésitations, synchronisation audio/vidéo et colorimétrie professionnelle.",
    features: [
      "Étalonnage vidéo & nettoyage des bruits parasites",
      "Ajout générique, virgules sonores et transitions",
      "2 allers-retours de retouches inclus",
    ],
    isPopular: false,
    iconName: "edit",
    isActive: true,
    order: 3,
  },
  {
    id: "fallback-service-2",
    type: "SERVICE",
    name: "Pack Shorts & Reels (3 extraits)",
    price: "15 000",
    unit: "FCFA / pack",
    description: "3 extraits percutants verticaux (format 9:16) avec sous-titres animés pour maximiser votre visibilité.",
    features: [
      "Format vertical 9:16 (TikTok, Reels, Shorts)",
      "Sous-titres mot-à-mot dynamiques",
      "Accroches et teasers viraux calibrés",
    ],
    isPopular: false,
    iconName: "video",
    isActive: true,
    order: 4,
  },
  {
    id: "fallback-service-3",
    type: "SERVICE",
    name: "Coaching & Direction Éditoriale",
    price: "30 000",
    unit: "FCFA / session",
    description: "Session de cadrage d'1h30 avec un producteur pour affûter votre concept et structurer vos interviews.",
    features: [
      "Positionnement et ligne éditoriale du podcast",
      "Grille de questions d'interview percutantes",
      "Conseils de prise de parole et présence au micro",
    ],
    isPopular: false,
    iconName: "coach",
    isActive: true,
    order: 5,
  },
];

// Helper pour associer une icône aux espaces
function getSpaceIcon(spaceName: string) {
  const lower = spaceName.toLowerCase();
  if (lower.includes("vip")) return <Crown className="w-4 h-4 text-[#FFBF00]" />;
  if (lower.includes("conférence") || lower.includes("conference")) return <Users2 className="w-4 h-4 text-[#FFBF00]" />;
  if (lower.includes("extérieur") || lower.includes("exterieur")) return <Trees className="w-4 h-4 text-[#FFBF00]" />;
  return <Building2 className="w-4 h-4 text-[#FFBF00]" />;
}

// Helper pour associer une icône aux services
function getServiceIcon(iconName?: string) {
  switch (iconName) {
    case "edit":
      return <Edit3 className="w-5 h-5 text-[#FFBF00]" />;
    case "video":
      return <Video className="w-5 h-5 text-[#FFBF00]" />;
    case "coach":
      return <Headphones className="w-5 h-5 text-[#FFBF00]" />;
    default:
      return <Sparkles className="w-5 h-5 text-[#FFBF00]" />;
  }
}

export default function TarifsPage() {
  const fetcher = (url: string) => fetchApi(url).then((res) => res.data);
  const { data: apiOffers, isLoading } = useSWR("/studio-offers", fetcher);

  const offers = useMemo(() => {
    if (apiOffers && Array.isArray(apiOffers) && apiOffers.length > 0) {
      return apiOffers;
    }
    return FALLBACK_OFFERS;
  }, [apiOffers]);

  const packages = useMemo(() => {
    return offers.filter((o: any) => o.type === "PACKAGE");
  }, [offers]);

  const services = useMemo(() => {
    return offers.filter((o: any) => o.type === "SERVICE");
  }, [offers]);

  const [selectedService, setSelectedService] = useState<string>("Enregistrement Brut - Studio Principal / Annexe (20 000 FCFA/h)");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const openBooking = (serviceName: string) => {
    setSelectedService(serviceName);
    setIsModalOpen(true);
  };

  const faqs = [
    {
      q: "Où se situe exactement le studio à Bamako ?",
      a: "Notre studio principal est situé au cœur de Bamako dans un quartier calme et facilement accessible, avec parking surveillé. L'adresse exacte et l'itinéraire géolocalisé vous sont transmis immédiatement dès la validation de votre réservation.",
    },
    {
      q: "Quelle est la différence entre l'Enregistrement Brut et la Formule Express ?",
      a: "L'Enregistrement Brut est conçu pour les créateurs qui souhaitent monter eux-mêmes leur émission : nous vous remettons immédiatement les fichiers audio WAV et vidéo MP4 en haute fidélité. La Formule Express comprend quant à elle une réalisation multi-caméras en direct et un habillage complet : vous repartez avec votre épisode monté et prêt à être publié dès la fin de votre session.",
    },
    {
      q: "Quel matériel est mis à disposition lors des sessions ?",
      a: "Nous disposons exclusivement d'équipements de référence broadcast : micros dynamiques Shure SM7B, consoles Rodecaster Pro II, micros cravates HF pour les déplacements, caméras 4K Sony à optiques cinéma et éclairages LED doux en cabine insonorisée.",
    },
    {
      q: "Quels sont les modes de paiement acceptés ?",
      a: "Nous acceptons les paiements via Orange Money, Moov Money, Wave, virement bancaire et espèces sur place lors de votre session.",
    },
    {
      q: "Puis-je venir avec des invités sans expérience de micro ?",
      a: "Oui, tout à fait ! Un ingénieur du son de notre équipe est systématiquement présent lors de chaque session pour vous accueillir, équiper vos invités, calibrer la voix de chacun et assurer une ambiance sereine et détendue avant d'enregistrer.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white selection:bg-[#FFBF00] selection:text-[#0B0B0B] pb-32">
      {/* 1. HERO SECTION */}
      <section className="px-6 pt-16 pb-16 text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141414] border border-[#262626] text-xs font-semibold text-[#FFBF00]">
          <Mic className="w-3.5 h-3.5" />
          <span>Studio Professionnel Bamako Podcast</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-headline font-black tracking-tight leading-tight">
          Tarifs & Espaces de notre <span className="text-[#FFBF00]">Studio d'Enregistrement</span>
        </h1>

        <p className="text-sm sm:text-base text-[#A0A0A0] leading-relaxed max-w-2xl mx-auto">
          Enregistrez vos podcasts, interviews et prises de parole dans des conditions acoustiques optimales au cœur de Bamako. Choisissez la formule adaptée à votre rythme de publication.
        </p>

        {/* Reassurance Chips */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[#8E8E8E] font-medium pt-2">
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-[#FFBF00]" />
            Micros Shure SM7B & Caméras 4K
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-[#FFBF00]" />
            Cabine acoustique insonorisée
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-[#FFBF00]" />
            Ingénieur du son dédié sur place
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-[#FFBF00]" />
            Remise immédiate de vos fichiers
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <button
            onClick={() => openBooking("Formule Express - Studio Principal / Annexe (35 000 FCFA/h)")}
            className="px-8 py-3.5 rounded-full bg-[#FFBF00] hover:bg-[#e6ac00] text-[#0B0B0B] font-black text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Réserver un créneau studio
          </button>
          <a
            href="https://wa.me/22370000000?text=Bonjour%20Bamako%20Podcast,%20je%20souhaite%20r%C3%A9server%20un%20cr%C3%A9neau%20au%20studio"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3.5 rounded-full bg-[#141414] hover:bg-[#1E1E1E] border border-[#262626] text-white font-bold text-xs sm:text-sm transition-colors flex items-center gap-2"
          >
            <Phone className="w-4 h-4 text-[#25D366]" />
            <span>Discuter sur WhatsApp</span>
          </a>
        </div>
      </section>

      {/* 2. FORMULES PRINCIPALES (ENREGISTREMENT BRUT & FORMULE EXPRESS) */}
      <section className="px-4 sm:px-6 md:px-10 py-16 bg-[#111111] border-y border-[#222222]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1A1A1A] border border-[#2B2B2B] text-[11px] font-bold text-[#D0D0D0]">
              <Radio className="w-3.5 h-3.5 text-[#FFBF00]" />
              <span>Nos 2 Formules d'Enregistrement</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-headline font-black text-white tracking-tight">
              Choisissez votre formule de captation
            </h2>
            <p className="text-xs sm:text-sm text-[#888888] max-w-xl mx-auto">
              Que vous souhaitiez réaliser votre propre montage ou repartir avec un épisode finalisé en direct, nos espaces s'adaptent à vos besoins.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {packages.map((pkg: any) => {
              // Extraction des tarifs spécifiques par salle et des avantages génériques
              const spaceRates: Array<{ label: string; price: string }> = [];
              const inclusions: string[] = [];

              if (Array.isArray(pkg.features)) {
                pkg.features.forEach((feat: string) => {
                  if (feat.includes(" : ")) {
                    const [label, price] = feat.split(" : ");
                    spaceRates.push({ label: label.trim(), price: price.trim() });
                  } else {
                    inclusions.push(feat);
                  }
                });
              }

              return (
                <div
                  key={pkg.id}
                  className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all ${
                    pkg.isPopular
                      ? "bg-[#141414] border-2 border-[#FFBF00] shadow-2xl"
                      : "bg-[#141414] border border-[#262626] hover:border-[#383838]"
                  }`}
                >
                  {pkg.isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#FFBF00] text-[#0B0B0B] px-4 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow">
                      Recommandé • Prêt à diffuser
                    </div>
                  )}

                  <div className="space-y-6">
                    {/* Header de la formule */}
                    <div className="border-b border-[#242424] pb-5">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <h3 className="text-2xl font-headline font-black text-white">
                          {pkg.name}
                        </h3>
                        <span className="px-2.5 py-1 rounded-lg bg-[#1F1F1F] border border-[#2B2B2B] text-[11px] font-bold text-[#FFBF00]">
                          Dès {pkg.price} {pkg.unit}
                        </span>
                      </div>
                      <p className="text-xs text-[#A0A0A0] leading-relaxed">
                        {pkg.description}
                      </p>
                    </div>

                    {/* Grille des tarifs par espace/salle */}
                    <div className="space-y-2.5">
                      <h4 className="text-[11px] font-bold text-[#777777] uppercase tracking-wider">
                        Tarifs par salle & espace de tournage
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {spaceRates.map((space, sIdx) => (
                          <div
                            key={sIdx}
                            onClick={() => openBooking(`${pkg.name} - ${space.label} (${space.price})`)}
                            className="p-3 rounded-2xl bg-[#1A1A1A] hover:bg-[#222222] border border-[#262626] hover:border-[#FFBF00]/60 transition-all cursor-pointer group flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="p-1.5 rounded-lg bg-[#222222] group-hover:bg-[#FFBF00]/20 transition-colors shrink-0">
                                {getSpaceIcon(space.label)}
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white group-hover:text-[#FFBF00] transition-colors truncate">
                                  {space.label}
                                </p>
                                <span className="text-[10px] text-[#7A7A7A] block">
                                  Cliquer pour réserver
                                </span>
                              </div>
                            </div>
                            <span className="text-xs font-black text-[#FFBF00] shrink-0 font-mono">
                              {space.price}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Points clés et inclusions */}
                    <div className="space-y-2.5 pt-2">
                      <h4 className="text-[11px] font-bold text-[#777777] uppercase tracking-wider">
                        Inclus dans cette formule
                      </h4>
                      <ul className="space-y-2 text-xs">
                        {inclusions.map((inc, iIdx) => (
                          <li key={iIdx} className="flex items-start gap-2.5 leading-relaxed text-[#D0D0D0]">
                            <Check className="w-4 h-4 text-[#FFBF00] shrink-0 mt-0.5" />
                            <span>{inc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Actions de réservation */}
                  <div className="pt-6 mt-6 border-t border-[#222222] space-y-2.5">
                    <button
                      onClick={() => openBooking(`Formule ${pkg.name} (${pkg.price} ${pkg.unit})`)}
                      className={`w-full py-3.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        pkg.isPopular
                          ? "bg-[#FFBF00] hover:bg-[#e6ac00] text-[#0B0B0B] shadow-md active:scale-95"
                          : "bg-[#222222] hover:bg-[#2A2A2A] text-white hover:text-[#FFBF00]"
                      }`}
                    >
                      <span>Réserver avec {pkg.name}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <p className="text-[10px] text-center text-[#757575] font-medium">
                      Accompagnement technique sur place • Confirmation rapide
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. SERVICES COMPLÉMENTAIRES & POST-PRODUCTION */}
      <section className="px-4 sm:px-6 md:px-10 py-20 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#141414] border border-[#242424] text-[11px] font-bold text-[#A0A0A0]">
            <Sparkles className="w-3.5 h-3.5 text-[#FFBF00]" />
            <span>Prestations à la Carte</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-headline font-black text-white tracking-tight">
            Services Additionnels & Post-production
          </h2>
          <p className="text-xs sm:text-sm text-[#888888] max-w-lg mx-auto">
            Complétez votre session d'enregistrement selon vos besoins spécifiques pour sublimer vos contenus.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service: any) => (
            <div
              key={service.id}
              className="bg-[#141414] border border-[#242424] hover:border-[#383838] p-6 rounded-2xl transition-all flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#1C1C1C] border border-[#2A2A2A] flex items-center justify-center shrink-0">
                    {getServiceIcon(service.iconName)}
                  </div>
                  <div className="text-right">
                    <span className="font-headline font-black text-base text-[#FFBF00]">
                      {service.price}
                    </span>
                    {service.unit && (
                      <span className="text-[11px] text-[#808080] block font-medium">
                        {service.unit}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-[#FFBF00] transition-colors mb-1.5">
                    {service.name}
                  </h3>
                  <p className="text-xs text-[#8E8E8E] leading-relaxed">
                    {service.description}
                  </p>
                </div>

                {Array.isArray(service.features) && service.features.length > 0 && (
                  <ul className="space-y-2 pt-2 border-t border-[#1F1F1F]">
                    {service.features.map((feat: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-[11px] text-[#BFBFBF]">
                        <Check className="w-3.5 h-3.5 text-[#FFBF00] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="pt-5 mt-4 border-t border-[#1F1F1F]">
                <button
                  onClick={() => openBooking(`${service.name} (${service.price} ${service.unit || ""})`)}
                  className="w-full py-2.5 rounded-lg bg-[#1C1C1C] hover:bg-[#FFBF00] text-[#B8B8B8] hover:text-[#0B0B0B] text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Réserver ce service</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. FOIRE AUX QUESTIONS (FAQ) */}
      <section className="px-4 sm:px-6 md:px-10 py-16 bg-[#111111] border-t border-[#222222]">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-headline font-black text-white tracking-tight">
              Questions Fréquentes
            </h2>
            <p className="text-xs text-[#888888]">
              Tout ce que vous devez savoir avant votre session dans nos studios à Bamako.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl bg-[#141414] border border-[#242424] overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm font-bold text-white">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#FFBF00] shrink-0 transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 text-xs text-[#A0A0A0] leading-relaxed border-t border-[#1C1C1C] pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* MODAL DE RÉSERVATION */}
      <StudioBookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        preselectedService={selectedService}
      />
    </div>
  );
}
