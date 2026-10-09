"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, Image as ImageIcon, CheckCircle, ArrowRight, ArrowLeft, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CreatorOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    coverFile: null as File | null,
  });

  const nextStep = () => setStep((s) => Math.min(3, s + 1));
  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  const handleFinish = async () => {
    setLoading(true);
    // Simulation of API call to create podcast
    setTimeout(() => {
      setLoading(false);
      // Redirect to studio dashboard when done
      router.push("/studio");
    }, 1500);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#0B0B0B] text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-[#141414] border border-[#262626] rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
        
        {/* Progress Bar */}
        <div className="flex gap-2 mb-10">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${step >= i ? "bg-[#FFBF00]" : "bg-[#2A2A2A]"}`} />
          ))}
        </div>

        {/* STEP 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#1A1A1A] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#2A2A2A]">
                <Mic className="w-8 h-8 text-[#FFBF00]" />
              </div>
              <h1 className="text-2xl font-extrabold text-white">Quel est le nom de votre podcast ?</h1>
              <p className="text-sm text-[#888888] mt-2">Vous pourrez toujours le changer plus tard.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#B8B8B8] mb-2 uppercase tracking-wide">Titre du podcast</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[#0E0E0E] border border-[#262626] focus:border-[#FFBF00] text-white rounded-xl p-4 outline-none"
                  placeholder="ex: Les chroniques de Bamako"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#B8B8B8] mb-2 uppercase tracking-wide">CatÃ©gorie principale</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-[#0E0E0E] border border-[#262626] focus:border-[#FFBF00] text-white rounded-xl p-4 outline-none appearance-none"
                >
                  <option value="">SÃ©lectionnez une catÃ©gorie</option>
                  <option value="societe">SociÃ©tÃ© & Culture</option>
                  <option value="business">Business & Entrepreneuriat</option>
                  <option value="education">Ã‰ducation</option>
                  <option value="divertissement">Divertissement</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Description & Cover */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-extrabold text-white">Donnez une identitÃ© Ã  votre podcast</h1>
              <p className="text-sm text-[#888888] mt-2">Une belle description et une image accrocheuse attirent plus d'auditeurs.</p>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-[#B8B8B8] mb-2 uppercase tracking-wide">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full bg-[#0E0E0E] border border-[#262626] focus:border-[#FFBF00] text-white rounded-xl p-4 outline-none resize-none"
                  placeholder="De quoi parle votre podcast ? Donnez envie aux gens de l'Ã©couter..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#B8B8B8] mb-2 uppercase tracking-wide">Miniature (Cover)</label>
                <div className="border-2 border-dashed border-[#262626] hover:border-[#FFBF00] bg-[#0E0E0E] rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group">
                  <div className="w-12 h-12 bg-[#1A1A1A] group-hover:bg-[#FFBF00]/10 rounded-full flex items-center justify-center mb-3">
                    <UploadCloud className="w-6 h-6 text-[#757575] group-hover:text-[#FFBF00]" />
                  </div>
                  <span className="text-sm font-semibold text-white">Cliquez pour uploader une image</span>
                  <span className="text-xs text-[#757575] mt-1">JPG, PNG (max 5MB). Format carrÃ© recommandÃ©.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Ready */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in text-center">
            <div className="w-20 h-20 bg-[#FFBF00]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#FFBF00]/30">
              <CheckCircle className="w-10 h-10 text-[#FFBF00]" />
            </div>
            <h1 className="text-3xl font-extrabold text-white">Tout est prÃªt !</h1>
            <p className="text-base text-[#888888] max-w-md mx-auto leading-relaxed">
              Votre podcast <strong>{formData.title || "Mon super podcast"}</strong> est configurÃ©. Vous allez maintenant accÃ©der Ã  votre espace Studio oÃ¹ vous pourrez uploader votre tout premier Ã©pisode.
            </p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-10 pt-6 border-t border-[#262626] flex items-center justify-between">
          {step > 1 ? (
            <Button variant="ghost" onClick={prevStep} className="text-[#888888] hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" /> Retour
            </Button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button 
              onClick={nextStep} 
              disabled={step === 1 && !formData.title.trim()}
              className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold px-6"
            >
              Suivant <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleFinish} 
              disabled={loading}
              className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold px-8"
            >
              {loading ? "CrÃ©ation..." : "AccÃ©der Ã  mon Studio"} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

