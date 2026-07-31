"use client";
import { API_BASE_URL } from "@/lib/api";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Compass, Check, ArrowRight, SkipForward } from "lucide-react";

export const dynamic = "force-dynamic";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["fr", "bm"]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(["entrepreneuriat-mali"]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>(["ML"]);

  const router = useRouter();

  const handleFinish = async () => {
    const token = localStorage.getItem("bko_access_token");
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/me/preferences`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            languageCodes: selectedLanguages,
            topicIds: selectedTopics,
            countryIds: selectedCountries,
          }),
        });
      } catch (e) {}
    }
    router.push("/");
  };

  const toggleLanguage = (code: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const toggleTopic = (slug: string) => {
    setSelectedTopics((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const toggleCountry = (id: string) => {
    setSelectedCountries((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-8 space-y-6 shadow-2xl">
        <div className="flex justify-between items-center text-xs text-gray-400">
          <span>Étape {step} sur 4</span>
          <button onClick={handleFinish} className="flex items-center space-x-1 hover:text-[#E5A93C] transition">
            <span>Passer</span>
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Étape 1 : Bienvenue */}
        {step === 1 && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 bg-[#E5A93C] rounded-2xl flex items-center justify-center font-bold text-black text-3xl mx-auto shadow-lg">
              🎙️
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">Bienvenue sur Bamako Podcast</h2>
              <p className="text-xs text-gray-300 max-w-md mx-auto">
                La plateforme de référence pour découvrir, écouter et suivre les voies du Mali et de l'Afrique.
              </p>
            </div>
            <button
              onClick={() => setStep(2)}
              className="bg-[#E5A93C] text-black font-extrabold px-8 py-3 rounded-full text-xs hover:bg-[#F5B82E] transition shadow-lg inline-flex items-center space-x-2"
            >
              <span>COMMENCER LA PERSONNALISATION</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Étape 2 : Langues */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-white">Quelles langues souhaitez-vous écouter ?</h2>
              <p className="text-xs text-gray-400">Sélectionnez vos langues de prédilection.</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {[
                { code: "bm", name: "Bamanankan (Bambara)", desc: "Émissions et contes en bambara" },
                { code: "fr", name: "Français", desc: "Podcasts business, culture et actualités" },
                { code: "en", name: "English", desc: "Podcasts internationaux et régionaux" },
              ].map((lang) => {
                const isSelected = selectedLanguages.includes(lang.code);
                return (
                  <div
                    key={lang.code}
                    onClick={() => toggleLanguage(lang.code)}
                    className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      isSelected ? "border-[#E5A93C] bg-[#E5A93C]/10 text-white" : "border-[#1E2638] bg-[#0A0D14] text-gray-300"
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-sm">{lang.name}</h4>
                      <p className="text-xs text-gray-400">{lang.desc}</p>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-[#E5A93C]" />}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setStep(3)}
              className="w-full bg-[#E5A93C] text-black font-extrabold py-3 rounded-xl text-xs hover:bg-[#F5B82E] transition shadow-lg"
            >
              CONTINUER
            </button>
          </div>
        )}

        {/* Étape 3 : Sujets */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-white">Quels thèmes vous passionnent ?</h2>
              <p className="text-xs text-gray-400">Choisissez les sujets pour votre recommandation.</p>
            </div>

            <div className="flex flex-wrap gap-3">
              {[
                { slug: "entrepreneuriat-mali", label: "Entrepreneuriat" },
                { slug: "culture-mandingue", label: "Culture & Mandé" },
                { slug: "agrobusiness-sahel", label: "Agrobusiness" },
                { slug: "fintech-afrique", label: "Fintech & Tech" },
              ].map((t) => {
                const isSelected = selectedTopics.includes(t.slug);
                return (
                  <button
                    key={t.slug}
                    onClick={() => toggleTopic(t.slug)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center space-x-2 ${
                      isSelected ? "bg-[#E5A93C] text-black" : "bg-[#0A0D14] border border-[#1E2638] text-gray-300"
                    }`}
                  >
                    <span>{t.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setStep(4)}
              className="w-full bg-[#E5A93C] text-black font-extrabold py-3 rounded-xl text-xs hover:bg-[#F5B82E] transition shadow-lg"
            >
              CONTINUER
            </button>
          </div>
        )}

        {/* Étape 4 : Pays & Fin */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-white">Quels pays souhaitez-vous suivre ?</h2>
              <p className="text-xs text-gray-400">Le Mali est sélectionné par défaut.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "ML", flag: "🇲🇱", name: "Mali" },
                { id: "SN", flag: "🇸🇳", name: "Sénégal" },
                { id: "CI", flag: "🇨🇮", name: "Côte d'Ivoire" },
                { id: "BF", flag: "🇧🇫", name: "Burkina Faso" },
              ].map((c) => {
                const isSelected = selectedCountries.includes(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => toggleCountry(c.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      isSelected ? "border-[#E5A93C] bg-[#E5A93C]/10 text-white" : "border-[#1E2638] bg-[#0A0D14] text-gray-300"
                    }`}
                  >
                    <span className="text-sm font-bold">{c.flag} {c.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-[#E5A93C]" />}
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleFinish}
              className="w-full bg-[#E5A93C] text-black font-extrabold py-3 rounded-xl text-xs hover:bg-[#F5B82E] transition shadow-lg"
            >
              COMMENCER À ÉCOUTER 🎧
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
