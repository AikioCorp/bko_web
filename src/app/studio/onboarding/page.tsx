"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Mic, 
  Image as ImageIcon, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  UploadCloud, 
  Radio, 
  Sparkles, 
  Globe, 
  Loader2,
  AlertCircle,
  HelpCircle,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function CreatorOnboardingPage() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [countries, setCountries] = useState<Array<{ id: string; name: string }>>([]);
  const [createdPodcastId, setCreatedPodcastId] = useState<string | null>(null);

  // Données du parcours créateur
  const [formData, setFormData] = useState({
    // Étape 1 : Profil créateur / Signature
    displayName: user?.fullName || "",
    creatorBio: "Créateur de podcasts engagé sur Bamako Podcast.",
    // Étape 2 : Émission initiale
    title: "",
    description: "",
    categoryId: "",
    primaryLanguageCode: "fr",
    countryId: "",
    coverUrl: "",
  });

  useEffect(() => {
    fetchApi('/me/creator-profile').then(res => {
      if (res.data) setFormData(previous => ({ ...previous,
        displayName: res.data.displayName, creatorBio: res.data.bio || '',
        countryId: res.data.countryId || previous.countryId,
      }));
    }).catch(() => setError('Impossible de vérifier votre profil créateur. Rechargez la page.'));
    fetchApi('/countries').then(res => setCountries(res.data || []))
      .catch(() => setError('Impossible de charger les pays. Rechargez la page.'));
    // Charger la liste officielle des catégories
    fetchApi("/categories")
      .then((res) => {
        if (res?.data && Array.isArray(res.data)) {
          setCategories(res.data);
          if (res.data.length > 0) {
            setFormData((prev) => ({ ...prev, categoryId: prev.categoryId || res.data[0].id }));
          }
        }
      })
      .catch(() => {});
  }, []);

  const nextStep = () => {
    setError("");
    if (step === 1 && !formData.displayName.trim()) {
      setError("Veuillez renseigner votre nom public ou pseudo de créateur.");
      return;
    }
    if (step === 2 && !formData.title.trim()) {
      setError("Le titre de votre première émission est obligatoire.");
      return;
    }
    setStep((s) => Math.min(3, s + 1));
  };

  const prevStep = () => {
    setError("");
    setStep((s) => Math.max(1, s - 1));
  };

  const handleFinish = async (createPodcast = true) => {
    if (loading) return;
    if (!formData.displayName.trim()) {
      setStep(1); setError('Indiquez votre nom public.'); return;
    }
    if (createPodcast && !formData.countryId) {
      setStep(2); setError('Sélectionnez le pays de votre émission.'); return;
    }
    setError("");
    setLoading(true);

    try {
      // 1. Activer le profil créateur
        await fetchApi("/me/creator-profile", {
          method: "POST",
          body: JSON.stringify({
            displayName: formData.displayName.trim(),
            bio: formData.creatorBio.trim(),
            countryId: formData.countryId || undefined,
            createPerson: true,
          }),
        });
      const me = await fetchApi('/me');
      if (!me.data) throw new Error('Impossible de synchroniser votre compte. Réessayez.');
      updateUser(me.data);
      if (!createPodcast) { router.push('/studio?welcome=true'); return; }
      if (createdPodcastId) { router.push(`/studio/podcasts/${createdPodcastId}`); return; }

      // 2. Créer la première émission
      const podcastRes = await fetchApi("/creator/podcasts", {
        method: "POST",
        body: JSON.stringify({
          name: formData.title.trim(),
          description: formData.description.trim() || `Émission animée par ${formData.displayName.trim()}`,
          countryId: formData.countryId,
          primaryLanguageCode: formData.primaryLanguageCode,
          cover: formData.coverUrl.trim(),
          status: 'DRAFT',
          categoryIds: formData.categoryId ? [formData.categoryId] : [],
        }),
      });

      // 3. Rediriger vers le Studio avec message de bienvenue
      if (podcastRes?.data?.id) {
        setCreatedPodcastId(podcastRes.data.id);
        router.push(`/studio/podcasts/${podcastRes.data.id}`);
      } else {
        throw new Error('Le serveur n’a pas confirmé la création de l’émission.');
      }
    } catch (err: any) {
      setError(err?.message || "Impossible de finaliser l'activation. Veuillez réessayer.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#0B0B0B] text-white flex flex-col items-center justify-center p-4 sm:p-6 select-none">
      <div className="w-full max-w-2xl bg-[#121212] border border-[#222222] rounded-3xl p-6 sm:p-10 shadow-2xl relative">
        
        {/* Étape & Progression */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#FFBF00] uppercase tracking-wider">
              Étape {step} sur 3
            </span>
            <span className="text-xs text-[#666666]">•</span>
            <span className="text-xs text-[#888888]">
              {step === 1 ? "Identité créateur" : step === 2 ? "Votre première émission" : "Confirmation & Studio"}
            </span>
          </div>

          <div className="flex gap-1.5 w-32">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  step >= i ? "bg-[#FFBF00]" : "bg-[#222222]"
                }`}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 p-3.5 rounded-xl text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <p className="text-sm text-[#B8B8B8] mb-4">L’activation du Studio est gratuite. Votre première émission sera enregistrée en brouillon.</p>
        <Button type="button" variant="ghost" disabled={loading}
          onClick={() => handleFinish(false)} className="text-[#FFBF00] mb-4">
          Activer mon Studio et créer mon émission plus tard
        </Button>
        {step === 2 && <div className="mb-4">
          <label htmlFor="creator-cover" className="block text-sm mb-2">Lien de couverture (facultatif pour le brouillon)</label>
          <input id="creator-cover" type="url" value={formData.coverUrl}
            onChange={e => setFormData({ ...formData, coverUrl: e.target.value })}
            placeholder="https://…" className="w-full bg-[#0B0B0B] border border-[#262626] rounded-xl p-3" />
        </div>}
        {step === 2 && <div className="mb-4">
          <label htmlFor="creator-country" className="block text-sm mb-2">Pays de l’émission</label>
          <select id="creator-country" value={formData.countryId}
            onChange={e => setFormData({ ...formData, countryId: e.target.value })}
            className="w-full bg-[#0B0B0B] border border-[#262626] rounded-xl p-3">
            <option value="">Choisir un pays</option>
            {countries.map(country => <option key={country.id} value={country.id}>{country.name}</option>)}
          </select>
        </div>}

        {/* ========================================================================= */}
        {/* ÉTAPE 1 : Identité & Profil Créateur */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#1C180E] border border-[#FFBF00]/40 flex items-center justify-center text-[#FFBF00] mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Activez votre profil Créateur
              </h1>
              <p className="text-xs sm:text-sm text-[#888888] leading-relaxed">
                Ce profil représentera votre marque ou votre nom auprès de l’ensemble de la communauté d'auditeurs.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#CCCCCC]">
                  Nom public ou Nom de scène *
                </label>
                <input
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="ex: Mamadou Studio, Radio Nieta, Awa Traoré"
                  className="w-full bg-[#0B0B0B] border border-[#262626] focus:border-[#FFBF00] text-white rounded-xl p-3.5 text-xs sm:text-sm outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#CCCCCC]">
                  Courte bio de présentation
                </label>
                <textarea
                  rows={2}
                  value={formData.creatorBio}
                  onChange={(e) => setFormData({ ...formData, creatorBio: e.target.value })}
                  placeholder="Présentez votre parcours, vos sujets de prédilection ou votre vision en 2 lignes..."
                  className="w-full bg-[#0B0B0B] border border-[#262626] focus:border-[#FFBF00] text-white rounded-xl p-3.5 text-xs sm:text-sm outline-none transition-colors resize-none"
                />
              </div>

              <div className="p-4 rounded-2xl bg-[#161616] border border-[#242424] space-y-2">
                <span className="text-xs font-bold text-[#FFBF00] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Vos avantages immédiats
                </span>
                <ul className="text-xs text-[#999999] space-y-1 list-disc pl-4">
                  <li>Tableau de bord de suivi d'écoutes et de fidélité</li>
                  <li>Hébergement audio & vidéo 100% gratuit et illimité</li>
                  <li>Page publique dédiée et flux RSS automatique</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ÉTAPE 2 : Première Émission */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#1C180E] border border-[#FFBF00]/40 flex items-center justify-center text-[#FFBF00] mb-3">
                <Mic className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Configurez votre première émission
              </h1>
              <p className="text-xs sm:text-sm text-[#888888] leading-relaxed">
                Donnez un titre et une thématique à votre podcast. Vous pourrez tout modifier plus tard.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#CCCCCC]">
                  Titre de l'émission *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="ex: Les Chroniques de Bamako, Sahel Éco..."
                  className="w-full bg-[#0B0B0B] border border-[#262626] focus:border-[#FFBF00] text-white rounded-xl p-3.5 text-xs sm:text-sm outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#CCCCCC]">
                    Thématique / Catégorie
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full bg-[#0B0B0B] border border-[#262626] focus:border-[#FFBF00] text-white rounded-xl p-3.5 text-xs outline-none cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#CCCCCC]">
                    Langue principale
                  </label>
                  <select
                    value={formData.primaryLanguageCode}
                    onChange={(e) => setFormData({ ...formData, primaryLanguageCode: e.target.value })}
                    className="w-full bg-[#0B0B0B] border border-[#262626] focus:border-[#FFBF00] text-white rounded-xl p-3.5 text-xs outline-none cursor-pointer"
                  >
                    <option value="bm">Bamanankan (Bambara)</option>
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                    <option value="ff">Fulfulde (Peul)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#CCCCCC]">
                  Description de l'émission
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="De quoi parle votre émission ? Quels sont vos invités ou vos sujets ?"
                  className="w-full bg-[#0B0B0B] border border-[#262626] focus:border-[#FFBF00] text-white rounded-xl p-3.5 text-xs outline-none transition-colors resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ÉTAPE 3 : Validation & Lancement */}
        {/* ========================================================================= */}
        {step === 3 && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 rounded-3xl bg-[#1C180E] border border-[#FFBF00] flex items-center justify-center text-[#FFBF00] mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Félicitations, vous êtes prêt !
              </h1>
              <p className="text-xs sm:text-sm text-[#888888] max-w-md mx-auto leading-relaxed">
                Votre émission <strong className="text-white">{formData.title}</strong> et votre profil <strong className="text-[#FFBF00]">{formData.displayName}</strong> sont prêts à être initialisés.
              </p>
            </div>

            <div className="bg-[#0B0B0B] border border-[#222222] rounded-2xl p-5 text-left max-w-md mx-auto space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-[#666666]">Créateur :</span>
                <span className="font-bold text-white">{formData.displayName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#666666]">Émission :</span>
                <span className="font-bold text-[#FFBF00]">{formData.title}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#666666]">Langue :</span>
                <span className="font-medium text-white">
                  {formData.primaryLanguageCode === "bm" ? "Bamanankan" : "Français"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Barre de navigation bas */}
        <div className="mt-8 pt-6 border-t border-[#222222] flex items-center justify-between gap-4">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              className="border-[#262626] text-[#A0A0A0] hover:text-white rounded-xl text-xs"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Retour
            </Button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button
              type="button"
              onClick={nextStep}
              className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-extrabold px-6 rounded-xl text-xs flex items-center gap-1.5 shadow-md"
            >
              <span>Continuer</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="button"
              disabled={loading}
              onClick={() => handleFinish(true)}
              className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-extrabold px-8 rounded-xl text-xs flex items-center gap-2 shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Activation en cours...</span>
                </>
              ) : (
                <>
                  <span>Créer mon émission & Ouvrir le Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
