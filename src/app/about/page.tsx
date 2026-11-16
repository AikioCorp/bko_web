import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Mic,
  Radio,
  Globe2,
  Users,
  Award,
  Sparkles,
  ArrowRight,
  MapPin,
  Building2,
  CheckCircle2,
  Headphones,
} from "lucide-react";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "À Propos de Bamako Podcast | La voix du Mali et du Mandé",
  description:
    "Découvrez la mission, la vision et l'infrastructure de Bamako Podcast : valoriser les récits, la culture et l'actualité du Mali et d'Afrique grâce à un studio professionnel et une plateforme digitale de pointe.",
  openGraph: {
    title: "À Propos — Bamako Podcast",
    description: "La plateforme de référence pour découvrir, écouter et créer des podcasts au Mali et dans la diaspora.",
  },
};

export default function AboutPage() {
  return (
    <LegalPageLayout
      title="À Propos de Bamako Podcast"
      subtitle="La plateforme sonore et visuelle de référence dédiée aux voix, aux récits et à la créativité du Mali, du Mandé et de toute l'Afrique."
      badgeText="Plateforme & Studio d'Enregistrement"
      lastUpdated="26 Octobre 2026"
    >
      <div className="space-y-12 text-[#D0D0D0] leading-relaxed text-sm sm:text-base">
        {/* Mission principale */}
        <section className="bg-[#141414] border border-[#262626] rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFBF00] text-[#0B0B0B] flex items-center justify-center shrink-0 font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Notre mission : Raconter l'Afrique par les Africains
              </h2>
              <p className="text-xs sm:text-sm text-[#888888]">
                Donner un écrin technologique d'excellence aux récits d'aujourd'hui et de demain
              </p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-[#AAAAAA]">
            Née à Bamako au cœur de la tradition orale du Mandé, <strong className="text-white">Bamako Podcast</strong> combine le meilleur de la technologie moderne (streaming adaptatif, synchronisation cloud, lecteur persistant, applications mobiles natives) et la richesse infinie de nos patrimoines oraux. Notre ambition est de faire rayonner les débats d'actualité, l'entrepreneuriat, la littérature, la musique, l'histoire et les contes traditionnels auprès des citoyens du continent et des diasporas mondiales.
          </p>
        </section>

        {/* 3 piliers */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg sm:text-xl border-b border-[#222222] pb-3">
            <span className="text-[#FFBF00]">1.</span>
            <h2>Nos 3 piliers fondateurs</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-[#FFBF00]/15 text-[#FFBF00] flex items-center justify-center font-bold">
                <Globe2 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-white text-base">Accessibilité Totale</h3>
              <p className="text-xs text-[#888888]">
                Une écoute fluide pensée pour les réalités de la bande passante en Afrique : mise en mémoire tampon optimisée, écoute hors ligne et navigation multilingue (Français, Bambara).
              </p>
            </div>

            <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-[#FFBF00]/15 text-[#FFBF00] flex items-center justify-center font-bold">
                <Mic className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-white text-base">Studio Acoustique Physique</h3>
              <p className="text-xs text-[#888888]">
                Un complexe d'enregistrement insonorisé et climatisé à Badalabougou avec micros broadcast Shure SM7B, régie vidéo multi-caméras 4K et ingénieurs du son dédiés.
              </p>
            </div>

            <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-[#FFBF00]/15 text-[#FFBF00] flex items-center justify-center font-bold">
                <Award className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-white text-base">Écosystème Créateur Équitable</h3>
              <p className="text-xs text-[#888888]">
                Un portail Studio complet pour synchroniser vos flux RSS et vos chaînes YouTube officielles, piloter vos équipes et toucher une audience qualifiée et engagée.
              </p>
            </div>
          </div>
        </section>

        {/* Le Studio Physique à Badalabougou */}
        <section className="space-y-4 border border-[#262626] bg-[#121212] rounded-xl p-6 sm:p-8">
          <div className="flex items-center gap-2.5 text-white font-bold text-base sm:text-lg">
            <Building2 className="w-5 h-5 text-[#FFBF00]" />
            <h3>2. Le Studio Physique de Bamako Podcast</h3>
          </div>
          <p className="text-xs sm:text-sm text-[#AAAAAA]">
            Vous êtes podcasteur, entreprise, ONG ou créateur indépendant ? Notre studio situé à Badalabougou vous ouvre ses portes pour des sessions d'enregistrement audio et vidéo dans des conditions acoustiques optimales :
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div className="bg-[#181818] p-3.5 rounded-lg border border-[#2A2A2A] flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#FFBF00] shrink-0" />
              <span>Micros de référence Shure SM7B & consoles broadcast Rodecaster Pro II</span>
            </div>
            <div className="bg-[#181818] p-3.5 rounded-lg border border-[#2A2A2A] flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#FFBF00] shrink-0" />
              <span>Captation multi-caméras 4K Sony & habillage visuel en direct</span>
            </div>
            <div className="bg-[#181818] p-3.5 rounded-lg border border-[#2A2A2A] flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#FFBF00] shrink-0" />
              <span>Cabines insonorisées traitées acoustiquement & confort premium</span>
            </div>
            <div className="bg-[#181818] p-3.5 rounded-lg border border-[#2A2A2A] flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#FFBF00] shrink-0" />
              <span>Production express de capsules verticales (TikTok, Reels, Shorts)</span>
            </div>
          </div>
          <div className="pt-2">
            <Link
              href="/tarifs"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] transition-colors"
            >
              <span>Consulter nos formules & Réserver une session</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>

        {/* Contact et Partenariats */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg sm:text-xl border-b border-[#222222] pb-3">
            <span className="text-[#FFBF00]">3.</span>
            <h2>Nous contacter & Partenariats</h2>
          </div>
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-3 text-xs sm:text-sm text-[#AAAAAA]">
            <p>
              Pour toute proposition de partenariat, projet éditorial, parrainage ou couverture médiatique :
            </p>
            <ul className="space-y-1.5 pl-1">
              <li>
                <strong className="text-white">Email Direction & Partenariats :</strong>{" "}
                <Link href="mailto:contact@bamakopodcast.com" className="text-[#FFBF00] hover:underline">
                  contact@bamakopodcast.com
                </Link>
              </li>
              <li>
                <strong className="text-white">Support & Assistance technique :</strong>{" "}
                <Link href="/support" className="text-[#FFBF00] hover:underline">
                  support@bamakopodcast.com
                </Link>
              </li>
              <li>
                <strong className="text-white">Localisation :</strong> Rue 114, Porte 245, Badalabougou, Bamako, Mali.
              </li>
            </ul>
          </div>
        </section>
      </div>
    </LegalPageLayout>
  );
}
