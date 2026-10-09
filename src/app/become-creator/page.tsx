"use client";

import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Mic, Globe, TrendingUp, Users, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function BecomeCreatorPage() {
  const { user, isAuthenticated, setAuth } = useAuthStore();
  const router = useRouter();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      if (user && !(user.roles || []).includes("CREATOR")) {
        const updatedUser = { ...user, roles: [...(user.roles || []), "CREATOR"] };
        setAuth(updatedUser, useAuthStore.getState().accessToken || "", undefined);
      }
      router.push("/studio");
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white selection:bg-[#FFBF00] selection:text-[#0B0B0B]">
      {/* Hero Section */}
      <section className="relative px-6 py-20 md:py-32 flex flex-col items-center justify-center text-center w-full">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1C1C1C] border border-[#2E2E2E] text-xs font-semibold text-[#FFBF00] mb-8">
          <Mic className="w-3.5 h-3.5" />
          <span>Rejoignez le réseau des créateurs maliens</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-headline font-extrabold leading-tight mb-6">
          Faites entendre votre voix.<br className="hidden md:block" />
          <span className="text-[#FFBF00]">Partagez votre histoire en audio & vidéo.</span>
        </h1>
        
        <p className="text-base md:text-lg text-[#B8B8B8] max-w-2xl mb-10 leading-relaxed">
          Rejoignez Bamako Podcast en tant que créateur. Hébergez vos émissions gratuitement, que ce soit en format audio ou vidéo, atteignez une audience engagée et monétisez votre contenu.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {mounted && isAuthenticated ? <button onClick={handleUpgrade} disabled={isUpgrading} className="px-8 py-3.5 rounded-full bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-extrabold text-sm flex items-center gap-2 transition-all shadow-md active:scale-95 w-full sm:w-auto justify-center">{isUpgrading ? "Activation..." : "Activer mon espace Studio"}<ArrowRight className="w-4 h-4" /></button> : mounted ? <Link href="/login?tab=register" className="px-8 py-3.5 rounded-full bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-extrabold text-sm flex items-center gap-2 transition-all shadow-md active:scale-95 w-full sm:w-auto justify-center">Créer mon podcast gratuitement<ArrowRight className="w-4 h-4" /></Link> : null}
          <Link href="#studios" className="px-8 py-3.5 rounded-full bg-[#1C1C1C] hover:bg-[#252525] border border-[#2E2E2E] text-white font-semibold text-sm transition-all w-full sm:w-auto justify-center">
            Voir notre Studio Physique
          </Link>
        </div>
      </section>

      {/* Pourquoi nous rejoindre */}
      <section className="px-6 py-20 bg-[#141414] border-y border-[#242424]">
        <div className="w-full">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">Pourquoi choisir Bamako Podcast ?</h2>
            <p className="text-[#B8B8B8] max-w-xl mx-auto">
              Une plateforme conçue spécifiquement pour mettre en valeur les créateurs africains, avec des outils adaptés à notre réalité.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-[#0B0B0B] border border-[#242424] p-8 rounded-2xl flex flex-col items-start hover:border-[#FFBF00]/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#1C1C1C] flex items-center justify-center mb-6">
                <Globe className="w-6 h-6 text-[#FFBF00]" />
              </div>
              <h3 className="text-lg font-bold mb-3">Diffusion mondiale</h3>
              <p className="text-sm text-[#B8B8B8] leading-relaxed">
                Votre podcast est distribué automatiquement sur toutes les plateformes majeures (Spotify, Apple Podcasts) tout en ayant sa page dédiée ici.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#0B0B0B] border border-[#242424] p-8 rounded-2xl flex flex-col items-start hover:border-[#FFBF00]/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#1C1C1C] flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-[#FFBF00]" />
              </div>
              <h3 className="text-lg font-bold mb-3">Monétisation intégrée</h3>
              <p className="text-sm text-[#B8B8B8] leading-relaxed">
                Générez des revenus grâce au soutien direct de vos auditeurs via Orange Money/Moov, et accédez à notre réseau d'annonceurs locaux.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#0B0B0B] border border-[#242424] p-8 rounded-2xl flex flex-col items-start hover:border-[#FFBF00]/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#1C1C1C] flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6 text-[#FFBF00]" />
              </div>
              <h3 className="text-lg font-bold mb-3">Hébergement 100% gratuit</h3>
              <p className="text-sm text-[#B8B8B8] leading-relaxed">
                Aucun frais mensuel. Importez autant d'épisodes que vous le souhaitez, sans limite de bande passante ni de stockage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Le Studio Bamako Podcast */}
      <section id="studios" className="px-6 py-24 w-full flex flex-col lg:flex-row items-center gap-16">
        <div className="lg:w-1/2 space-y-6">
          <h2 className="text-3xl md:text-4xl font-headline font-bold leading-tight">
            Pas de matériel ?<br />
            <span className="text-[#757575]">Notre studio vous ouvre ses portes.</span>
          </h2>
          <p className="text-[#B8B8B8] text-base leading-relaxed">
            Nous disposons de notre propre studio d'enregistrement professionnel à Bamako. 
            En tant que créateur sur notre plateforme, vous bénéficiez de notre expertise et d'un accompagnement technique sur-mesure pour vos enregistrements audios et vidéos.
          </p>
          <ul className="space-y-4 pt-4 mb-8">
            <li className="flex items-center gap-3 text-sm font-medium">
              <CheckCircle2 className="w-5 h-5 text-[#FFBF00]" />
              Équipement de pointe (Caméras, Micros, lumières)
            </li>
            <li className="flex items-center gap-3 text-sm font-medium">
              <CheckCircle2 className="w-5 h-5 text-[#FFBF00]" />
              Ingénieurs du son et monteurs vidéos disponibles
            </li>
            <li className="flex items-center gap-3 text-sm font-medium">
              <CheckCircle2 className="w-5 h-5 text-[#FFBF00]" />
              Espace climatisé, insonorisé et prêt à filmer
            </li>
          </ul>
          
          <Link href="/tarifs" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#1C1C1C] hover:bg-[#252525] border border-[#2E2E2E] text-white font-semibold text-sm transition-all shadow-md active:scale-95">
            Voir nos forfaits d'enregistrement
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="lg:w-1/2 w-full grid grid-cols-2 gap-4">
          <div className="space-y-4 pt-8">
            <div className="relative h-48 rounded-2xl overflow-hidden bg-[#1C1C1C] border border-[#2E2E2E]">
              <Image src="/images/image1.jpg" alt="Studio 1" fill className="object-cover opacity-80" />
            </div>
            <div className="relative h-64 rounded-2xl overflow-hidden bg-[#1C1C1C] border border-[#2E2E2E]">
              <Image src="/images/image 2.jpg" alt="Studio 2" fill className="object-cover opacity-80" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="relative h-64 rounded-2xl overflow-hidden bg-[#1C1C1C] border border-[#2E2E2E]">
              <Image src="/images/image 3.jpg" alt="Studio 3" fill className="object-cover opacity-80" />
            </div>
            <div className="relative h-48 rounded-2xl overflow-hidden bg-[#1C1C1C] border border-[#2E2E2E]">
              <Image src="/images/image4.jpg" alt="Studio 4" fill className="object-cover opacity-80" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="px-6 py-20 bg-[#FFBF00] text-[#0B0B0B] text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-headline font-extrabold mb-6">
            Prêt à lancer votre émission ?
          </h2>
          <p className="text-[#1A1A1A] font-medium mb-10 max-w-xl mx-auto">
            La création de votre espace podcast prend moins de 2 minutes. Démarrez dès aujourd'hui et construisez votre communauté.
          </p>
          {mounted && isAuthenticated ? <button onClick={handleUpgrade} disabled={isUpgrading} className="inline-flex px-10 py-4 rounded-full bg-[#0B0B0B] text-white hover:bg-[#1A1A1A] hover:scale-105 font-extrabold text-sm transition-all shadow-xl active:scale-95">{isUpgrading ? "Activation..." : "Activer mon Studio maintenant"}</button> : mounted ? <Link href="/login?tab=register" className="inline-flex px-10 py-4 rounded-full bg-[#0B0B0B] text-white hover:bg-[#1A1A1A] hover:scale-105 font-extrabold text-sm transition-all shadow-xl active:scale-95">Créer mon compte créateur</Link> : null}
        </div>
      </section>
    </div>
  );
}
