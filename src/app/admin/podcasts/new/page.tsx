"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // next/navigation
import Link from "next/link";
import useSWR from "swr";
import { adminApi } from "@/lib/api";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  CheckCircle,
  AlertCircle,
  UploadCloud,
  Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  { id: 1, title: "Identité", description: "Nom et description" },
  { id: 2, title: "Visuels", description: "Pochette et bannière" },
  { id: 3, title: "Classification", description: "Langues et pays" },
  { id: 4, title: "Gestion", description: "Propriétaire" },
];

export default function NewPodcastWizard() {
  // Use "next/navigation" router
  const router = require("next/navigation").useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    descriptionShort: "",
    description: "",
    cover: "",
    banner: "",
    primaryLanguageCode: "",
    secondaryLanguageCodes: [] as string[],
    categoryIds: [] as string[],
    countryId: "",
    city: "",
    creatorName: "",
    website: "",
  });

  // Load drafts from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem("podcast_wizard_draft");
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setFormData(parsed.formData);
        setCurrentStep(parsed.currentStep || 1);
      } catch (e) {
        console.error("Erreur de restauration du brouillon", e);
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem("podcast_wizard_draft", JSON.stringify({ currentStep, formData }));
  }, [currentStep, formData]);

  // Fetch Categories & Languages for Step 3
  const { data: catData } = useSWR("/admin/categories", (url) => adminApi(url).then(res => res.data));
  const { data: langData } = useSWR("/admin/languages", (url) => adminApi(url).then(res => res.data));
  const { data: countryData } = useSWR("/countries", (url) => adminApi(url).then(res => res.data));

  const categories = (catData || []).filter((c: any) => c.isActive);
  const languages = (langData || []).filter((l: any) => l.isActive);
  const countries = Array.isArray(countryData) ? countryData : [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCategoryToggle = (id: string) => {
    setFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter(c => c !== id)
        : [...prev.categoryIds, id]
    }));
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const validateStep = () => {
    if (currentStep === 1) {
      if (!formData.name || !formData.description) {
        setError("Le nom et la description complète sont obligatoires.");
        return false;
      }
    }
    if (currentStep === 3) {
      // Pour valider/publier, il faudrait vérifier, mais en brouillon c'est flexible
    }
    setError(null);
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      nextStep();
    }
  };

  const handleSave = async (publish: boolean) => {
    // If publish is true, check strict validation
    if (publish) {
      if (!formData.name || !formData.description || !formData.cover || !formData.primaryLanguageCode || formData.categoryIds.length === 0) {
        setError("Pour publier, vous devez fournir un nom, une description, une pochette, une langue principale et au moins une catégorie.");
        return;
      }
    } else {
      // Draft mode is flexible
      if (!formData.name) {
        setError("Un nom est requis même pour un brouillon.");
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    const { descriptionShort, creatorName, secondaryLanguageCodes, ...rest } = formData;
    const payload = {
      ...rest,
      cover: formData.cover || "https://placehold.co/400x400/171717/FFBF00?text=Podcast",
      shortDescription: descriptionShort || undefined,
      countryId: formData.countryId || "ML",
      primaryLanguageCode: formData.primaryLanguageCode || undefined,
      status: publish ? "PUBLISHED" : "DRAFT"
    };

    try {
      const res = await adminApi("/admin/podcasts", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      
      if (!res.success) throw new Error(res.message || res.message || "Erreur de création");

      // Clear draft
      localStorage.removeItem("podcast_wizard_draft");
      
      // Redirect to the management page
      router.push(`/admin/podcasts/${res.data.id || res.data.slug}`);
    } catch (e: any) {
      setError(e.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col pb-32 text-white">
      
      {/* Header */}
      <div className="space-y-6 mb-8">
        <Link href="/admin/podcasts" className="inline-flex items-center text-sm font-semibold text-[#757575] hover:text-[#FFBF00] transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Retour aux podcasts
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-white">Ajouter un podcast</h1>
          <p className="text-[#888888] mt-1">Créez une émission étape par étape, puis ajoutez ses épisodes.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Left Sidebar: Steps Indicator */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-[#171717] border border-[#2A2A2A] rounded-xl p-4 sticky top-6">
            <div className="space-y-6 relative">
              {/* Line connector */}
              <div className="absolute left-[15px] top-6 bottom-6 w-[2px] bg-[#2A2A2A] z-0" />
              
              {STEPS.map((step) => {
                const isActive = currentStep === step.id;
                const isPast = currentStep > step.id;
                
                return (
                  <div key={step.id} className="relative z-10 flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                      isActive ? "bg-[#FFBF00] text-[#0B0B0B] ring-4 ring-[#FFBF00]/20" 
                      : isPast ? "bg-[#FFBF00] text-[#0B0B0B]"
                      : "bg-[#2A2A2A] text-[#757575]"
                    }`}>
                      {isPast ? <CheckCircle className="w-4 h-4" /> : step.id}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${isActive ? "text-white" : isPast ? "text-[#B8B8B8]" : "text-[#757575]"}`}>
                        {step.title}
                      </p>
                      <p className={`text-xs ${isActive ? "text-[#B8B8B8]" : "text-[#555555]"}`}>{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Content: Forms */}
        <div className="flex-1 bg-[#171717] border border-[#2A2A2A] rounded-xl p-6 md:p-8">
          
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-8">
            
            {/* STEP 1: IDENTITÉ */}
            {currentStep === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4">
                <h2 className="text-lg font-bold text-white mb-6">Identité du podcast</h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-[#757575] uppercase mb-2">Nom de l'émission <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleChange} 
                      placeholder="Ex: Les voix de Bamako"
                      className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#757575] uppercase mb-2">Description courte (Slogan)</label>
                    <input 
                      type="text" 
                      name="descriptionShort" 
                      value={formData.descriptionShort} 
                      onChange={handleChange} 
                      placeholder="Ex: Rencontres avec celles et ceux qui font vivre Bamako."
                      className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#757575] uppercase mb-2">Description complète <span className="text-red-500">*</span></label>
                    <textarea 
                      name="description" 
                      rows={5} 
                      value={formData.description} 
                      onChange={handleChange} 
                      placeholder="Présentez le concept de l'émission en détail..."
                      className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white resize-none" 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: VISUELS */}
            {currentStep === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4">
                <h2 className="text-lg font-bold text-white mb-6">Identité visuelle</h2>
                <div className="space-y-8">
                  <div>
                    <label className="block text-xs font-bold text-[#757575] uppercase mb-2">Pochette (Format carré) <span className="text-red-500">*</span></label>
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      <div className="w-32 h-32 shrink-0 bg-[#0B0B0B] border border-[#2A2A2A] border-dashed rounded-xl flex items-center justify-center overflow-hidden relative group">
                        {formData.cover ? (
                          <img src={formData.cover} alt="Cover preview" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-[#2A2A2A]" />
                        )}
                        <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                          <UploadCloud className="w-6 h-6 text-white mb-1" />
                          <span className="text-[10px] font-bold text-white">Changer</span>
                          <input 
                            type="file" 
                            accept="image/*"
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (e) => {
                                  setFormData({ ...formData, cover: e.target?.result as string });
                                };
                                reader.readAsDataURL(file);
                              }
                            }} 
                          />
                        </label>
                      </div>
                      <div className="flex-1 space-y-3 w-full">
                        <input 
                          type="text" 
                          name="cover" 
                          value={formData.cover} 
                          onChange={handleChange} 
                          placeholder="URL de l'image (https://...)"
                          className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white" 
                        />
                        <label className="w-full flex items-center justify-center bg-[#0B0B0B] border border-[#2A2A2A] border-dashed text-white hover:bg-[#262626] rounded-md h-10 px-4 cursor-pointer text-sm font-medium transition-colors">
                          <UploadCloud className="w-4 h-4 mr-2" /> Uploader une image
                          <input 
                            type="file" 
                            accept="image/*"
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (e) => {
                                  setFormData({ ...formData, cover: e.target?.result as string });
                                };
                                reader.readAsDataURL(file);
                              }
                            }} 
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#757575] uppercase mb-2">Bannière (Optionnel)</label>
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      {formData.banner && (
                        <div className="w-full md:w-64 h-32 shrink-0 bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl flex items-center justify-center overflow-hidden relative group">
                          <img src={formData.banner} alt="Banner preview" className="w-full h-full object-cover" />
                          <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                            <UploadCloud className="w-6 h-6 text-white mb-1" />
                            <span className="text-[10px] font-bold text-white">Changer</span>
                            <input 
                              type="file" 
                              accept="image/*"
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (e) => {
                                    setFormData({ ...formData, banner: e.target?.result as string });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }} 
                            />
                          </label>
                        </div>
                      )}
                      <div className="flex-1 space-y-3 w-full">
                        <input 
                          type="text" 
                          name="banner" 
                          value={formData.banner} 
                          onChange={handleChange} 
                          placeholder="URL de la bannière (https://...)"
                          className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white" 
                        />
                        <label className="w-full flex items-center justify-center bg-[#0B0B0B] border border-[#2A2A2A] border-dashed text-white hover:bg-[#262626] rounded-md h-10 px-4 cursor-pointer text-sm font-medium transition-colors">
                          <UploadCloud className="w-4 h-4 mr-2" /> Uploader une bannière
                          <input 
                            type="file" 
                            accept="image/*"
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (e) => {
                                  setFormData({ ...formData, banner: e.target?.result as string });
                                };
                                reader.readAsDataURL(file);
                              }
                            }} 
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: CLASSIFICATION */}
            {currentStep === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4">
                <h2 className="text-lg font-bold text-white mb-6">Classification</h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-[#757575] uppercase mb-2">Langue principale <span className="text-red-500">*</span></label>
                      <select 
                        name="primaryLanguageCode" 
                        value={formData.primaryLanguageCode} 
                        onChange={handleChange}
                        className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white appearance-none"
                      >
                        <option value="">Sélectionner...</option>
                        {languages.map((l: any) => (
                          <option key={l.code} value={l.code}>{l.name} ({l.nativeName})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#757575] uppercase mb-2">Pays d'origine</label>
                      <select
                        name="countryId"
                        value={formData.countryId || "ML"}
                        onChange={handleChange}
                        className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white appearance-none"
                      >
                        {countries.length === 0 && <option value="ML">Mali</option>}
                        {countries.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.flagEmoji ? `${c.flagEmoji} ` : ""}{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#757575] uppercase mb-3">Catégories (Au moins 1 pour publier)</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {categories.map((c: any) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleCategoryToggle(c.id)}
                          className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors text-left ${
                            formData.categoryIds.includes(c.id)
                              ? "bg-[#FFBF00]/10 border-[#FFBF00] text-[#FFBF00]"
                              : "bg-[#0B0B0B] border-[#2A2A2A] text-white hover:border-[#757575]"
                          }`}
                        >
                          {c.icon && <span>{c.icon}</span>}
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: GESTION */}
            {currentStep === 4 && (
              <div className="animate-in fade-in slide-in-from-right-4">
                <h2 className="text-lg font-bold text-white mb-6">Gestion de l'émission</h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-[#757575] uppercase mb-2">Créateur / Propriétaire</label>
                    <input 
                      type="text" 
                      name="creatorName" 
                      value={formData.creatorName} 
                      onChange={handleChange} 
                      placeholder="Nom de l'organisation ou de la personne..."
                      className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white" 
                    />
                    <p className="text-xs text-[#757575] mt-1.5">Permet de distinguer l'administrateur qui saisit la fiche du véritable propriétaire du contenu.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#757575] uppercase mb-2">Site Web (Optionnel)</label>
                    <input 
                      type="url" 
                      name="website" 
                      value={formData.website} 
                      onChange={handleChange} 
                      placeholder="https://..."
                      className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white" 
                    />
                  </div>
                </div>

                <div className="mt-8 bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl p-5">
                  <h3 className="text-sm font-bold text-white mb-2">Finalisation</h3>
                  <p className="text-xs text-[#B8B8B8] mb-5">Vous pouvez enregistrer ce podcast en tant que brouillon pour le compléter plus tard, ou l'enregistrer et l'ajouter immédiatement au catalogue.</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={() => handleSave(false)} 
                      disabled={isSubmitting}
                      className="bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white border-none w-full sm:w-auto"
                    >
                      <Save className="w-4 h-4 mr-2" /> Enregistrer le brouillon
                    </Button>
                    <Button 
                      onClick={() => handleSave(true)} 
                      disabled={isSubmitting}
                      className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold w-full sm:w-auto"
                    >
                      Enregistrer et publier
                    </Button>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Navigation Bottom Bar */}
          <div className="mt-8 pt-6 border-t border-[#2A2A2A] flex items-center justify-between">
            {currentStep > 1 ? (
              <Button variant="ghost" onClick={prevStep} className="text-[#B8B8B8] hover:text-white">
                <ChevronLeft className="w-4 h-4 mr-1" /> Précédent
              </Button>
            ) : (
              <div></div> // Spacer
            )}
            
            {currentStep < STEPS.length && (
              <Button onClick={handleNext} className="bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white">
                Suivant <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
