"use client";

import React, { useState } from "react";
import Link from "next/link";
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
  ArrowRight
} from "lucide-react";
import { StudioBookingModal } from "@/components/modals/StudioBookingModal";

export default function TarifsPage() {
  const [selectedService, setSelectedService] = useState<string>("Forfait Professionnel (150 000 FCFA)");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const openBooking = (serviceName: string) => {
    setSelectedService(serviceName);
    setIsModalOpen(true);
  };

  const packages = [
    {
      name: "Baroni",
      price: "75 000",
      currency: "FCFA",
      unit: "/ mois",
      description: "Pour lancer votre émission avec un accompagnement rigoureux.",
      features: [
        "2h d'enregistrement en studio insonorisé",
        "4 épisodes montés et masterisés",
        "Distribution sur Bamako Podcast, Spotify, Apple",
        "Assistance technique et support WhatsApp",
      ],
      popular: false,
      ctaLabel: "Choisir Baroni",
    },
    {
      name: "Professionnel",
      price: "150 000",
      currency: "FCFA",
      unit: "/ mois",
      description: "La formule phare des créateurs réguliers et leaders d'opinion.",
      features: [
        "6h d'enregistrement mensuel (créneaux flexibles)",
        "Jusqu'à 10 épisodes montés, calibrés et optimisés",
        "Création des visuels de promotion et miniatures",
        "Session mensuelle de coaching éditorial et positionnement",
        "Export vidéo cadré pour extraits réseaux sociaux (Reels/Shorts)",
      ],
      popular: true,
      ctaLabel: "Choisir la formule Pro",
    },
    {
      name: "Entreprise & ONG",
      price: "Sur mesure",
      currency: "",
      unit: "",
      description: "Production audiovisuelle complète pour marques et institutions.",
      features: [
        "Créneaux de studio illimités selon planning",
        "Équipe technique dédiée (ingénieur son + cadreur)",
        "Captation multi-caméras 4K & habillage institutionnel",
        "Formation de vos porte-paroles & modération",
        "Contrat de confidentialité & facturation conforme",
      ],
      popular: false,
      ctaLabel: "Demander un devis",
    },
  ];

  const services = [
    {
      name: "Enregistrement Podcast Standard",
      price: "25 000 FCFA",
      description: "Accès studio 45 min avec ingénieur du son + montage audio prêt à diffuser.",
      icon: <Mic className="w-5 h-5 text-[#FFBF00]" />,
    },
    {
      name: "Pack Vidéo-Podcast Pro",
      price: "45 000 FCFA",
      description: "Captation vidéo 4K, montage dynamique, habillage sonore et 2 teasers verticaux.",
      icon: <Video className="w-5 h-5 text-[#FFBF00]" />,
    },
    {
      name: "Coaching Éditorial & Format",
      price: "30 000 FCFA",
      description: "1h30 pour structurer votre concept, votre cible, votre grille de questions et votre audience.",
      icon: <Edit3 className="w-5 h-5 text-[#FFBF00]" />,
    },
    {
      name: "Masterclass / Formation Podcast",
      price: "50 000 FCFA",
      description: "Atelier pratique de 4h en studio : prise de voix, animation, montage sur Reaper/Audition.",
      icon: <Headphones className="w-5 h-5 text-[#FFBF00]" />,
    },
    {
      name: "Location Studio Seul",
      price: "15 000 FCFA",
      description: "Accès à nos micros Shure SM7B et Rodecaster Pro II avec votre propre équipe technique.",
      icon: <Layers className="w-5 h-5 text-[#FFBF00]" />,
    },
    {
      name: "Diffusion & SEO Référencement",
      price: "20 000 FCFA",
      description: "Optimisation des titres, résumés, tags et mise en avant dans les rayons du catalogue.",
      icon: <Share2 className="w-5 h-5 text-[#FFBF00]" />,
    },
  ];

  const faqs = [
    {
      q: "Où se situe exactement le studio à Bamako ?",
      a: "Notre studio principal est situé au cœur de Bamako, facile d'accès avec parking sécurisé. L'adresse exacte et l'itinéraire vous sont transmis dès confirmation de votre réservation.",
    },
    {
      q: "Quel matériel est mis à disposition lors de l'enregistrement ?",
      a: "Nous utilisons exclusivement du matériel de niveau broadcast : micros dynamiques Shure SM7B, consoles Rodecaster Pro II, casques de monitoring Beyerdynamic et caméras 4K haute fidélité dans une cabine insonorisée.",
    },
    {
      q: "Puis-je venir avec des invités débutants ?",
      a: "Absolument ! Notre ingénieur du son est présent à chaque session pour installer vos invités, régler les niveaux de voix et vous mettre immédiatement en confiance avant d'appuyer sur REC.",
    },
    {
      q: "Sous quel délai reçois-je mes épisodes montés ?",
      a: "Les montages audio standards sont livrés sous 48h à 72h ouvrées après l'enregistrement, avec possibilité de demande de retouche.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white selection:bg-[#FFBF00] selection:text-[#0B0B0B] pb-32">
      {/* 1. HERO SECTION */}
      <section className="px-6 pt-16 pb-16 text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#181818] border border-[#2A2A2A] text-xs font-semibold text-[#FFBF00]">
          <Mic className="w-3.5 h-3.5" />
          <span>Le Studio Physique de Bamako Podcast</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-headline font-black tracking-tight leading-tight">
          Produisez votre émission dans un <span className="text-[#FFBF00]">Studio Professionnel</span>
        </h1>

        <p className="text-sm sm:text-base text-[#A0A0A0] leading-relaxed max-w-2xl mx-auto">
          Basé à Bamako, notre studio vous offre une acoustique irréprochable, du matériel broadcast de référence et une équipe d'ingénieurs du son dédiée pour faire briller votre voix.
        </p>

        {/* Reassurance Chips */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[#8E8E8E] font-medium pt-2">
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-[#FFBF00]" />
            Micros Shure SM7B & Caméras 4K
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-[#FFBF00]" />
            Cabine traitée phoniquement
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-[#FFBF00]" />
            Ingénieur du son sur place
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <button
            onClick={() => openBooking("Forfait Professionnel (150 000 FCFA)")}
            className="px-8 py-3.5 rounded-full bg-[#FFBF00] hover:bg-[#e6ac00] text-[#0B0B0B] font-black text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Réserver un créneau studio
          </button>
          <a
            href="https://wa.me/22370000000?text=Bonjour%20Bamako%20Podcast,%20je%20souhaite%20des%20informations%20sur%20les%20tarifs%20du%20studio"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3.5 rounded-full bg-[#181818] hover:bg-[#222222] border border-[#2A2A2A] text-white font-bold text-xs sm:text-sm transition-colors flex items-center gap-2"
          >
            <Phone className="w-4 h-4 text-[#25D366]" />
            <span>Échanger sur WhatsApp</span>
          </a>
        </div>
      </section>

      {/* 2. FORFAITS MENSUELS (Règle des 3 cartes web-designer) */}
      <section className="px-4 sm:px-6 md:px-10 py-16 bg-[#101010] border-y border-[#202020]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-headline font-black text-white tracking-tight">
              Nos Forfaits Mensuels
            </h2>
            <p className="text-xs sm:text-sm text-[#888888]">
              Idéal pour enregistrer avec régularité et bâtir une audience fidèle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {packages.map((pkg, idx) => (
              <div
                key={idx}
                className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all ${
                  pkg.popular
                    ? "bg-[#161616] border-2 border-[#FFBF00] shadow-xl md:-translate-y-2"
                    : "bg-[#141414] border border-[#262626] hover:border-[#383838]"
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#FFBF00] text-[#0B0B0B] px-4 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow">
                    Formule Recommandée
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-headline font-black text-white">{pkg.name}</h3>
                    <p className="text-xs text-[#808080] mt-1 leading-snug">{pkg.description}</p>
                  </div>

                  <div className="py-2 border-b border-[#242424]">
                    <span className="text-3xl sm:text-4xl font-headline font-black text-[#FFBF00]">
                      {pkg.price}
                    </span>
                    {pkg.currency && <span className="text-sm font-bold text-white ml-1.5">{pkg.currency}</span>}
                    {pkg.unit && <span className="text-xs text-[#888888] ml-1">{pkg.unit}</span>}
                  </div>

                  <ul className="space-y-3 py-2 text-xs">
                    {pkg.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5 leading-relaxed text-[#D0D0D0]">
                        <Check className="w-4 h-4 text-[#FFBF00] shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 mt-4 border-t border-[#222222] space-y-2">
                  <button
                    onClick={() => openBooking(`Forfait ${pkg.name} (${pkg.price} ${pkg.currency})`)}
                    className={`w-full py-3 rounded-xl font-black text-xs transition-all cursor-pointer ${
                      pkg.popular
                        ? "bg-[#FFBF00] hover:bg-[#e6ac00] text-[#0B0B0B] shadow-md active:scale-95"
                        : "bg-[#202020] hover:bg-[#2A2A2A] text-white hover:text-[#FFBF00]"
                    }`}
                  >
                    {pkg.ctaLabel}
                  </button>
                  <p className="text-[10px] text-center text-[#757575] font-medium">
                    Sans engagement • Annulable à tout moment
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. SERVICES À LA CARTE */}
      <section className="px-4 sm:px-6 md:px-10 py-20 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-headline font-black text-white tracking-tight">
            Services & Prestations à la Carte
          </h2>
          <p className="text-xs sm:text-sm text-[#888888]">
            Payez uniquement pour la prestation dont vous avez besoin, au rythme de vos sorties.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((service, idx) => (
            <div
              key={idx}
              className="bg-[#141414] border border-[#222222] hover:border-[#383838] p-6 rounded-2xl transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#1C1C1C] border border-[#2A2A2A] flex items-center justify-center shrink-0">
                    {service.icon}
                  </div>
                  <span className="font-headline font-black text-sm text-[#FFBF00]">
                    {service.price}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-[#FFBF00] transition-colors">
                  {service.name}
                </h3>
                <p className="text-xs text-[#8E8E8E] leading-relaxed">
                  {service.description}
                </p>
              </div>

              <div className="pt-5 mt-4 border-t border-[#1F1F1F]">
                <button
                  onClick={() => openBooking(`${service.name} (${service.price})`)}
                  className="w-full py-2 rounded-lg bg-[#1C1C1C] hover:bg-[#FFBF00] text-[#B8B8B8] hover:text-[#0B0B0B] text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
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
      <section className="px-4 sm:px-6 md:px-10 py-16 bg-[#101010] border-t border-[#202020]">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-headline font-black text-white tracking-tight">
              Questions Fréquentes
            </h2>
            <p className="text-xs text-[#888888]">
              Tout ce que vous devez savoir avant votre première session en studio.
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
