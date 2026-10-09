"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/token";
import { API_BASE_URL } from "@/lib/api";
import useSWR from "swr";
import { ArrowRight, Check, Compass, Radio } from "lucide-react";
import { fetchApi } from "@/lib/api";

const fetcher = (url: string) => fetchApi(url).then(res => res.data);

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const { data: catData } = useSWR("/categories", fetcher);
  const categoriesList = catData || [];

  const handleFinish = async () => {
    setIsSaving(true);
    const token = getAccessToken();
    if (token) {
      try {
        await fetch(API_BASE_URL + "/me", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({
            topicIds: selectedTopics,
          }),
        });
      } catch (e) {
        console.error(e);
      }
    }
    router.push("/");
  };

  const toggleTopic = (id: string) => {
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-lg bg-[#141414] border border-[#262626] rounded-2xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
        
        <div className="absolute top-0 left-0 h-1 bg-[#262626] w-full">
          <div 
            className="h-full bg-[#FFBF00] transition-all duration-500 ease-in-out"
            style={{ width: ((step / 2) * 100) + '%' }}
          />
        </div>

        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
              <div className="w-14 h-14 bg-[#FFBF00]/10 border border-[#FFBF00]/20 rounded-xl flex items-center justify-center mb-6">
                <Radio className="w-6 h-6 text-[#FFBF00]" />
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Bienvenue sur Bamako Podcast</h1>
              <p className="text-[#888888] text-sm leading-relaxed">
                La plateforme de référence pour découvrir, écouter et soutenir les voix du Mali et de l'Afrique. 
                Configurez votre profil pour obtenir des recommandations personnalisées.
              </p>
            </div>
            
            <button
              onClick={() => setStep(2)}
              className="w-full bg-white hover:bg-gray-100 text-black font-bold py-3.5 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 group"
            >
              <span>Continuer</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-white tracking-tight">Quels sujets vous intéressent ?</h1>
                <button onClick={handleFinish} className="text-[#666666] hover:text-white text-xs font-semibold transition-colors">
                  Passer
                </button>
              </div>
              <p className="text-[#888888] text-xs">
                Sélectionnez vos thématiques préférées pour affiner vos recommandations.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {categoriesList.length === 0 ? (
                <div className="w-full py-8 text-center text-[#666666] text-xs">
                  Chargement des catégories...
                </div>
              ) : (
                categoriesList.map((cat: any) => {
                  const isSelected = selectedTopics.includes(cat.id);
                  let btnClass = "px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 border flex items-center gap-2 ";
                  if (isSelected) {
                    btnClass += "bg-[#FFBF00] border-[#FFBF00] text-black shadow-sm";
                  } else {
                    btnClass += "bg-[#0E0E0E] border-[#262626] text-[#A0A0A0] hover:border-[#404040] hover:text-white";
                  }
                  
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleTopic(cat.id)}
                      className={btnClass}
                    >
                      <span>{cat.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </button>
                  );
                })
              )}
            </div>

            <button
              onClick={handleFinish}
              disabled={isSaving}
              className="w-full bg-[#FFBF00] hover:bg-[#E5AB00] text-black font-bold py-3.5 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <span className="animate-pulse">Enregistrement...</span>
              ) : (
                <>
                  <span>Commencer à écouter</span>
                  <Compass className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
