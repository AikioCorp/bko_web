"use client";

import React from "react";
import Link from "next/link";
import { Check, Mic, Video, Edit3, Share2, Calculator, Headphones, Sparkles } from "lucide-react";

export default function TarifsPage() {
  const packages = [
    {
      name: "Baroni",
      price: "75 000 FCFA",
      unit: "/ mois",
      description: "Parfait pour commencer",
      features: [
        "2h d'enregistrement",
        "4 épisodes montés",
        "Distribution basique",
        "Support Email/WhatsApp",
      ],
      popular: false,
    },
    {
      name: "Professionnel",
      price: "150 000 FCFA",
      unit: "/ mois",
      description: "Pour les créateurs réguliers",
      features: [
        "5h50 d'enregistrement/mois",
        "10 épisodes de 35min montés et optimisés",
        "Visuels personnalisés",
        "1 coaching personnalisé/mois",
      ],
      popular: true,
    },
    {
      name: "Entreprise / ONG",
      price: "Sur devis",
      unit: "",
      description: "Solutions sur-mesure",
      features: [
        "Accès studio illimité",
        "Équipe dédiée à la production",
        "Formation de l'équipe",
        "Support prioritaire 24/7",
      ],
      popular: false,
    },
  ];

  const services = [
    {
      name: "Podcast Standard",
      price: "25 000 FCFA",
      description: "Enregistrement + montage basique (≤ 45 min).",
      icon: <Mic className="w-5 h-5 text-[#FFBF00]" />,
    },
    {
      name: "Podcast Pro",
      price: "35 000 FCFA",
      description: "Montage avancé multi-pistes, habillage sonore, teaser.",
      icon: <Sparkles className="w-5 h-5 text-[#FFBF00]" />,
    },
    {
      name: "Formation Podcast",
      price: "50 000 FCFA",
      description: "Formation de 4h (Théorie + pratique en studio).",
      icon: <Headphones className="w-5 h-5 text-[#FFBF00]" />,
    },
    {
      name: "Coaching Éditorial",
      price: "30 000 FCFA",
      description: "Clarifiez votre cible, ton et roadmap éditoriale.",
      icon: <Edit3 className="w-5 h-5 text-[#FFBF00]" />,
    },
    {
      name: "Location Studio Seul",
      price: "10 000 FCFA",
      description: "45 min d'accès à notre studio (avec votre équipe).",
      icon: <Video className="w-5 h-5 text-[#FFBF00]" />,
    },
    {
      name: "Marketing & Diffusion",
      price: "20 000 FCFA",
      description: "Distribution et promo mensuelle (SEO, miniatures).",
      icon: <Share2 className="w-5 h-5 text-[#FFBF00]" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white selection:bg-[#FFBF00] selection:text-[#0B0B0B]">
      {/* Hero */}
      <section className="px-6 py-20 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1C1C1C] border border-[#2E2E2E] text-xs font-semibold text-[#FFBF00] mb-8">
          <Mic className="w-3.5 h-3.5" />
          <span>Le Studio Physique de Bamako Podcast</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-headline font-extrabold mb-6">
          Produisez dans notre <span className="text-[#FFBF00]">Studio Professionnel</span>
        </h1>
        <p className="text-base md:text-lg text-[#B8B8B8] leading-relaxed mb-10">
          Vous êtes à Bamako ? Vous n'avez pas de matériel de qualité ? Bamako Podcast vous met à disposition son studio équipé, ses ingénieurs du son et ses monteurs vidéos pour vous accompagner.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/contact" className="px-8 py-3.5 rounded-full bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-extrabold text-sm transition-all shadow-md active:scale-95">
            Réserver une session
          </Link>
        </div>
      </section>

      {/* Forfaits Mensuels */}
      <section className="px-6 py-20 bg-[#141414] border-y border-[#242424]">
        <div className="w-full">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">Nos Forfaits Mensuels</h2>
            <p className="text-[#B8B8B8]">Pour une collaboration régulière et un accompagnement de A à Z.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {packages.map((pkg, idx) => (
              <div 
                key={idx} 
                className={`relative bg-[#0B0B0B] rounded-2xl p-8 border flex flex-col ${pkg.popular ? 'border-[#FFBF00] shadow-[0_0_30px_rgba(255,191,0,0.1)] scale-105' : 'border-[#2E2E2E]'}`}
              >
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FFBF00] text-[#0B0B0B] px-4 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide">
                    Le plus choisi
                  </div>
                )}
                <h3 className="text-2xl font-headline font-bold mb-2">{pkg.name}</h3>
                <div className="mb-2">
                  <span className="text-3xl font-extrabold text-[#FFBF00]">{pkg.price}</span>
                  {pkg.unit && <span className="text-[#B8B8B8] ml-1">{pkg.unit}</span>}
                </div>
                <p className="text-[#757575] text-sm mb-8">{pkg.description}</p>
                
                <ul className="space-y-4 mb-8 flex-1">
                  {pkg.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-3 text-sm font-medium">
                      <Check className="w-5 h-5 text-[#FFBF00] shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Link href="/contact" className={`flex justify-center w-full py-3 rounded-full font-extrabold text-sm transition-all shadow-md active:scale-95 ${pkg.popular ? 'bg-[#FFBF00] text-[#0B0B0B] hover:bg-[#E5AB00]' : 'bg-[#1C1C1C] text-white hover:bg-[#2A2A2A] border border-[#2E2E2E]'}`}>
                  Choisir ce forfait
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services à la carte */}
      <section className="px-6 py-24 w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">Services à la Carte</h2>
          <p className="text-[#B8B8B8]">Payez uniquement pour ce dont vous avez besoin.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, idx) => (
            <div key={idx} className="bg-[#141414] border border-[#242424] p-6 rounded-2xl hover:border-[#FFBF00]/50 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#1C1C1C] flex items-center justify-center">
                  {service.icon}
                </div>
                <div className="text-right">
                  <div className="font-bold text-[#FFBF00]">{service.price}</div>
                </div>
              </div>
              <h3 className="text-lg font-bold mb-2">{service.name}</h3>
              <p className="text-sm text-[#B8B8B8] leading-relaxed mb-6">{service.description}</p>
              <Link href="/contact" className="text-sm font-bold text-white hover:text-[#FFBF00] flex items-center gap-1">
                Réserver <span className="text-lg leading-none">→</span>
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
