"use client";

import { useState } from "react";
import { Check, Info, Zap, Star, Building2, Crown, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";

const plans = [
  {
    id: "free",
    name: "Créateur Débutant",
    price: "0",
    description: "Pour lancer votre premier podcast.",
    icon: <Star className="w-5 h-5 text-zinc-400" />,
    features: [
      "1 podcast actif",
      "Jusqu'à 3 épisodes par mois",
      "Statistiques basiques",
      "Qualité audio standard (128kbps)",
      "Support communautaire"
    ],
    limitations: [
      "Pas de monétisation",
      "Pas d'accès aux studios physiques"
    ],
    cta: "Plan actuel",
    popular: false,
    color: "bg-zinc-800"
  },
  {
    id: "pro",
    name: "Pro",
    price: "4 900",
    period: "/mois",
    description: "Pour les créateurs réguliers et passionnés.",
    icon: <Zap className="w-5 h-5 text-[#FFBF00]" />,
    features: [
      "Jusqu'à 3 podcasts actifs",
      "Épisodes illimités",
      "Statistiques avancées",
      "Qualité audio HD (320kbps)",
      "Accès aux studios (1h/mois)",
      "Monétisation (70% des revenus)",
      "Support prioritaire"
    ],
    cta: "Passer en Pro",
    popular: true,
    color: "bg-[#FFBF00]"
  },
  {
    id: "studio",
    name: "Studio Partner",
    price: "19 900",
    period: "/mois",
    description: "Pour les professionnels et médias locaux.",
    icon: <Building2 className="w-5 h-5 text-emerald-400" />,
    features: [
      "Podcasts illimités",
      "Statistiques complètes & exports API",
      "Qualité audio Master (Lossless)",
      "Accès aux studios (5h/mois)",
      "Monétisation (90% des revenus)",
      "Marque blanche (sans logo Bamako)",
      "Gestion d'équipe (jusqu'à 5 membres)",
      "Account manager dédié"
    ],
    cta: "Devenir Partner",
    popular: false,
    color: "bg-emerald-500"
  }
];

export default function StudioPricingPage() {
  const { user } = useAuthStore();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col space-y-12 pb-24 text-white px-4 md:px-0">
      
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto pt-8">
        <h1 className="text-3xl md:text-5xl font-black font-headline">
          Choisissez le plan <span className="text-[#FFBF00]">parfait</span> pour votre voix
        </h1>
        <p className="text-[#B8B8B8] text-sm md:text-base">
          Des outils puissants pour chaque étape de votre parcours de créateur. 
          Passez au niveau supérieur et développez votre audience.
        </p>

        {/* Toggle Billing */}
        <div className="flex items-center justify-center gap-3 pt-6">
          <span className={`text-sm font-semibold transition-colors ${billingCycle === 'monthly' ? 'text-white' : 'text-[#757575]'}`}>Mensuel</span>
          <button 
            onClick={() => setBillingCycle(b => b === 'monthly' ? 'yearly' : 'monthly')}
            className="w-14 h-7 rounded-full bg-[#2A2A2A] relative flex items-center px-1 transition-colors hover:bg-[#333333]"
          >
            <div className={`w-5 h-5 rounded-full bg-[#FFBF00] shadow-sm transition-transform duration-300 ${billingCycle === 'yearly' ? 'translate-x-7' : ''}`} />
          </button>
          <span className={`text-sm font-semibold transition-colors flex items-center gap-2 ${billingCycle === 'yearly' ? 'text-white' : 'text-[#757575]'}`}>
            Annuel <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">-20%</span>
          </span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 pt-4">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            className={`relative rounded-3xl p-8 flex flex-col bg-[#141414] border ${plan.popular ? 'border-[#FFBF00] shadow-2xl shadow-[#FFBF00]/10 scale-100 md:scale-105 z-10' : 'border-[#242424] hover:border-[#333333]'} transition-all`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FFBF00] text-[#0B0B0B] text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5" /> Le plus choisi
              </div>
            )}

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center">
                  {plan.icon}
                </div>
                <h3 className="text-xl font-bold">{plan.name}</h3>
              </div>
              <p className="text-sm text-[#757575] h-10">{plan.description}</p>
              
              <div className="flex items-baseline gap-1 pt-2">
                <span className="text-4xl font-black">
                  {billingCycle === 'yearly' && plan.price !== "0" 
                    ? (parseInt(plan.price.replace(/\s/g, '')) * 0.8).toLocaleString('fr-FR')
                    : plan.price}
                </span>
                {plan.price !== "0" && <span className="text-lg font-bold text-[#757575]">FCFA</span>}
                <span className="text-sm text-[#757575] ml-1">{plan.price === "0" ? "" : (billingCycle === 'yearly' ? '/mois (facturé annuellement)' : plan.period)}</span>
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <div className="space-y-3">
                <p className="text-xs font-bold text-white/50 uppercase tracking-wider">Ce qui est inclus</p>
                {plan.features.map((feat, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <Check className={`w-5 h-5 shrink-0 ${plan.popular ? 'text-[#FFBF00]' : 'text-zinc-400'}`} />
                    <span className="text-[#E0E0E0] leading-snug">{feat}</span>
                  </div>
                ))}
                {plan.limitations?.map((feat, i) => (
                  <div key={`lim-${i}`} className="flex items-start gap-3 text-sm opacity-50">
                    <X className="w-5 h-5 shrink-0 text-red-400" />
                    <span className="text-[#757575] leading-snug">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[#242424]">
              <Button 
                className={`w-full h-12 rounded-xl text-sm font-bold transition-all ${
                  plan.id === 'free' 
                    ? 'bg-[#1A1A1A] hover:bg-[#242424] text-white border border-[#333333]' 
                    : plan.popular 
                      ? 'bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] shadow-lg hover:shadow-xl hover:-translate-y-0.5' 
                      : 'bg-white hover:bg-zinc-200 text-black'
                }`}
              >
                {plan.cta}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ ou Info supplmentaire */}
      <div className="pt-16 max-w-3xl mx-auto text-center space-y-6">
        <h2 className="text-xl font-bold">Besoin d'une offre sur mesure pour votre radio ?</h2>
        <p className="text-[#B8B8B8] text-sm">
          Nous accompagnons les grands médias maliens dans leur transition vers l'audio digital. 
          Hébergement très haute capacité, applications dédiées, et support technique 24/7.
        </p>
        <Button variant="outline" className="rounded-full px-8 bg-transparent border-[#333333] hover:bg-[#1A1A1A] hover:text-white">
          Contacter notre équipe Entreprise
        </Button>
      </div>

    </div>
  );
}



