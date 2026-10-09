"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Image as ImageIcon,
  Loader2,
  Headphones,
  Video,
  Radio,
  Rss,
  Building2,
  UserCheck,
  Globe,
  Sparkles,
  ArrowRight,
  Eye,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";

type FormatChoice = "AUDIO" | "VIDEO" | "HYBRID";

export default function NewPodcastWizard() {
  const router = useRouter();

  // Screen 2 (Choice) vs Screen 3 (Form)
  const [currentScreen, setCurrentScreen] = useState<"CHOICE" | "FORM">("CHOICE");
  const [selectedFormat, setSelectedFormat] = useState<FormatChoice>("AUDIO");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    descriptionShort: "",
    description: "",
    cover: "",
    banner: "",
    primaryLanguageCode: "fr",
    secondaryLanguageCodes: [] as string[],
    categoryIds: [] as string[],
    countryId: "ML",
    city: "",
    organizationId: "",
    ownershipStatus: "UNCLAIMED",
    website: "",
  });

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("bko_podcast_new_draft");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.formData) {
          const clean = { ...parsed.formData };
          if (clean.cover?.startsWith("data:")) clean.cover = "";
          if (clean.banner?.startsWith("data:")) clean.banner = "";
          setFormData(clean);
        }
        if (parsed.selectedFormat) setSelectedFormat(parsed.selectedFormat);
        if (parsed.currentScreen) setCurrentScreen(parsed.currentScreen);
      }
    } catch {}
  }, []);

  // Save draft
  useEffect(() => {
    try {
      const clean = {
        ...formData,
        cover: formData.cover.startsWith("data:") ? "" : formData.cover,
        banner: formData.banner.startsWith("data:") ? "" : formData.banner,
      };
      localStorage.setItem("bko_podcast_new_draft", JSON.stringify({
        currentScreen,
        selectedFormat,
        formData: clean,
      }));
    } catch {}
  }, [currentScreen, selectedFormat, formData]);

  // Referential data
  const { data: catData } = useSWR("/admin/categories", (url) => adminApi(url).then(res => res.data));
  const { data: langData } = useSWR("/admin/languages", (url) => adminApi(url).then(res => res.data));
  const { data: countryData } = useSWR("/countries", (url) => adminApi(url).then(res => res.data));
  const { data: orgsData } = useSWR("/admin/organizations", (url) => adminApi(url).then(res => res.data));

  const categories = (catData || []).filter((c: any) => c.isActive);
  const languages = (langData || []).filter((l: any) => l.isActive);
  const countries = Array.isArray(countryData) ? countryData : [];
  const organizations = Array.isArray(orgsData) ? orgsData : (orgsData?.items || []);

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

  const handleSecondaryLangToggle = (code: string) => {
    setFormData(prev => ({
      ...prev,
      secondaryLanguageCodes: prev.secondaryLanguageCodes.includes(code)
        ? prev.secondaryLanguageCodes.filter(c => c !== code)
        : [...prev.secondaryLanguageCodes, code]
    }));
  };

  // Upload image direct vers Cloudflare R2
  const handleImageFile = async (file: File, folder: "covers" | "banners") => {
    if (!file) return;
    if (folder === "covers") setUploadingCover(true);
    else setUploadingBanner(true);
    setError(null);

    try {
      const initRes = await adminApi("/media/images/upload-url", {
        method: "POST",
        body: JSON.stringify({
          mimeType: file.type || "image/jpeg",
          folder,
          sizeBytes: file.size
        })
      });

      if (!initRes.success || !initRes.data?.uploadUrl) {
        throw new Error(initRes.message || "Impossible d'obtenir l'URL de téléversement R2.");
      }

      const { uploadUrl, publicUrl } = initRes.data;

      const uploadHttp = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "image/jpeg" },
        body: file,
      });

      if (!uploadHttp.ok) {
        throw new Error(`Échec de l'envoi vers Cloudflare R2 (${uploadHttp.status})`);
      }

      setFormData(prev => ({
        ...prev,
        [folder === "covers" ? "cover" : "banner"]: publicUrl
      }));
    } catch (err: any) {
      setError(err.message || "Erreur de téléversement de l'image.");
    } finally {
      if (folder === "covers") setUploadingCover(false);
      else setUploadingBanner(false);
    }
  };

  // Enregistrement (Brouillon ou avec redirection)
  const handleSave = async (redirectTarget: "DETAILS" | "NEW_EPISODE" | "STAY") => {
    if (!formData.name.trim()) {
      setError("Le nom de l'émission est obligatoire.");
      return;
    }
    if (!formData.description.trim()) {
      setError("La description complète est obligatoire.");
      return;
    }
    if (!formData.cover) {
      setError("La pochette de l'émission est obligatoire.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        shortDescription: formData.descriptionShort.trim() || undefined,
        cover: formData.cover.trim(),
        banner: formData.banner.trim() || undefined,
        primaryLanguageCode: formData.primaryLanguageCode || "fr",
        secondaryLanguageCodes: formData.secondaryLanguageCodes,
        categoryIds: formData.categoryIds,
        countryId: formData.countryId || "ML",
        city: formData.city.trim() || undefined,
        organizationId: formData.organizationId || undefined,
        ownershipStatus: formData.ownershipStatus,
        website: formData.website.trim() || undefined,
        format: selectedFormat,
        status: "DRAFT",
      };

      const res = await adminApi("/admin/podcasts", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      if (!res.success) throw new Error(res.message || "Erreur de création de l'émission");

      localStorage.removeItem("bko_podcast_new_draft");
      const createdId = res.data.id || res.data.slug;

      if (redirectTarget === "NEW_EPISODE") {
        router.push(`/admin/podcasts/${createdId}/episodes/new`);
      } else {
        router.push(`/admin/podcasts/${createdId}`);
      }
    } catch (e: any) {
      setError(e.message || "Une erreur est survenue lors de l'enregistrement.");
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // ÉCRAN 2 — CHOIX DU PARCOURS DE CRÉATION
  // ==========================================
  if (currentScreen === "CHOICE") {
    return (
      <div className="w-full max-w-5xl mx-auto py-4 pb-28 text-white space-y-8 animate-in fade-in">
        
        {/* Navigation & Header */}
        <div className="space-y-3">
          <Link 
            href="/admin/podcasts" 
            className="inline-flex items-center text-xs font-semibold text-[#888888] hover:text-[#FFBF00] transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Retour aux émissions
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-[#FFBF00] uppercase tracking-wider">
            <span>Étape 1 sur 2</span>
            <span>•</span>
            <span>Type d'émission</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            Choisir le format de votre émission
          </h1>
          <p className="text-sm text-[#888888] max-w-2xl">
            Sélectionnez la structure principale de votre nouvelle émission. Le format choisi configure l'expérience par défaut de vos auditeurs et prépare la création de votre premier épisode.
          </p>
        </div>

        {/* Note pédagogique */}
        <div className="bg-[#171717] border border-[#2A2A2A] rounded-xl p-4 flex items-start gap-3.5">
          <Info className="w-5 h-5 text-[#FFBF00] shrink-0 mt-0.5" />
          <div className="text-xs text-[#B8B8B8] leading-relaxed">
            <span className="font-bold text-white">Évolution flexible : </span>
            Le format choisi décrit l'émission et prépare le parcours du premier épisode. Il reste possible d'ajouter d'autres formats plus tard (par exemple ajouter une vidéo filmée à un épisode d'une émission initialement audio).
          </div>
        </div>

        {/* Les 3 Grandes Cartes de Format */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Carte 1 : Émission audio */}
          <div 
            onClick={() => { setSelectedFormat("AUDIO"); setCurrentScreen("FORM"); }}
            className={`cursor-pointer rounded-2xl p-6 border transition-all flex flex-col justify-between group ${
              selectedFormat === "AUDIO" 
                ? "bg-[#171717] border-[#FFBF00] ring-1 ring-[#FFBF00]" 
                : "bg-[#171717] border-[#2A2A2A] hover:border-[#444444] hover:bg-[#1C1C1C]"
            }`}
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-xl bg-[#15232D] text-[#7DD3FC] border border-[#1E3A4C] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Headphones className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-[#FFBF00] transition-colors">
                  Émission audio
                </h3>
                <span className="inline-block mt-1 text-[11px] font-semibold text-[#7DD3FC] bg-[#15232D] px-2 py-0.5 rounded border border-[#1E3A4C]">
                  Podcast vocal classique
                </span>
              </div>
              <p className="text-xs text-[#888888] leading-relaxed">
                Idéal pour les chroniques parlées, interviews en studio, débats, documentaires sonores et récits. Conçu pour une écoute nomade fluide.
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-[#2A2A2A] flex items-center justify-between text-xs font-bold text-white group-hover:text-[#FFBF00]">
              <span>Configurer ce format</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Carte 2 : Émission vidéo */}
          <div 
            onClick={() => { setSelectedFormat("VIDEO"); setCurrentScreen("FORM"); }}
            className={`cursor-pointer rounded-2xl p-6 border transition-all flex flex-col justify-between group ${
              selectedFormat === "VIDEO" 
                ? "bg-[#171717] border-[#FFBF00] ring-1 ring-[#FFBF00]" 
                : "bg-[#171717] border-[#2A2A2A] hover:border-[#444444] hover:bg-[#1C1C1C]"
            }`}
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-xl bg-[#1F172E] text-[#D8B4FE] border border-[#3B2D54] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Video className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-[#FFBF00] transition-colors">
                  Émission vidéo
                </h3>
                <span className="inline-block mt-1 text-[11px] font-semibold text-[#D8B4FE] bg-[#1F172E] px-2 py-0.5 rounded border border-[#3B2D54]">
                  Format visuel & talk-show
                </span>
              </div>
              <p className="text-xs text-[#888888] leading-relaxed">
                Pour les talk-shows filmés, émissions plateau, reportages vidéo et vlogs culturels. Compatible avec les fichiers vidéo directs et les liens YouTube.
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-[#2A2A2A] flex items-center justify-between text-xs font-bold text-white group-hover:text-[#FFBF00]">
              <span>Configurer ce format</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Carte 3 : Émission audio et vidéo */}
          <div 
            onClick={() => { setSelectedFormat("HYBRID"); setCurrentScreen("FORM"); }}
            className={`cursor-pointer rounded-2xl p-6 border transition-all flex flex-col justify-between group ${
              selectedFormat === "HYBRID" 
                ? "bg-[#171717] border-[#FFBF00] ring-1 ring-[#FFBF00]" 
                : "bg-[#171717] border-[#2A2A2A] hover:border-[#444444] hover:bg-[#1C1C1C]"
            }`}
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-xl bg-[#262012] text-[#FFBF00] border border-[#524115] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-[#FFBF00] transition-colors">
                  Émission audio & vidéo
                </h3>
                <span className="inline-block mt-1 text-[11px] font-semibold text-[#FFBF00] bg-[#262012] px-2 py-0.5 rounded border border-[#524115]">
                  Double diffusion intégrée
                </span>
              </div>
              <p className="text-xs text-[#888888] leading-relaxed">
                Le meilleur des deux mondes : chaque épisode peut offrir une version audio pour l'écoute nomade et une version vidéo filmée pour le salon et mobile.
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-[#2A2A2A] flex items-center justify-between text-xs font-bold text-white group-hover:text-[#FFBF00]">
              <span>Configurer ce format</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>

        {/* Entrée distincte : Flux RSS */}
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#171717] border border-[#2A2A2A] flex items-center justify-center text-[#FFBF00] shrink-0">
              <Rss className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">J'ai déjà un flux RSS</h4>
              <p className="text-xs text-[#888888] mt-0.5">
                Vous hébergez déjà votre émission sur Acast, Anchor/Spotify for Podcasters ou un serveur dédié ? Importez-la en 4 étapes.
              </p>
            </div>
          </div>

          <Button 
            onClick={() => router.push("/admin/podcasts/import-rss")}
            variant="outline"
            className="bg-[#1F1F1F] hover:bg-[#2A2A2A] border-[#333333] text-white shrink-0 text-xs font-semibold h-10 px-5"
          >
            Importer via RSS
          </Button>
        </div>

      </div>
    );
  }

  // ==========================================
  // ÉCRAN 3 — INFORMATIONS DE L’ÉMISSION
  // ==========================================
  const formatLabels = {
    AUDIO: "Émission audio",
    VIDEO: "Émission vidéo",
    HYBRID: "Émission audio & vidéo",
  };

  return (
    <div className="w-full flex flex-col pb-32 text-white">
      
      {/* Fil d'Ariane & Titre */}
      <div className="space-y-4 mb-8">
        <button 
          onClick={() => setCurrentScreen("CHOICE")}
          className="inline-flex items-center text-xs font-semibold text-[#888888] hover:text-[#FFBF00] transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Modifier le format ({formatLabels[selectedFormat]})
        </button>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#FFBF00] uppercase tracking-wider mb-1">
              <span>Étape 2 sur 2</span>
              <span>•</span>
              <span>Informations générales</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              Créer une nouvelle émission
            </h1>
            <p className="text-sm text-[#888888] mt-1">
              Renseignez l'identité, les visuels, la classification et le responsable de l'émission.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#171717] border border-[#2A2A2A] text-xs font-semibold text-white">
            <span className="text-[#888888]">Format :</span>
            <span className="text-[#FFBF00]">{formatLabels[selectedFormat]}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Disposition principale : Formulaire (gauche) + Aperçu en direct (droite) */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Colonne Formulaire (2/3 sur desktop) */}
        <div className="w-full lg:flex-1 space-y-8">
          
          {/* BLOC 1 : IDENTITÉ */}
          <div className="bg-[#171717] border border-[#2A2A2A] rounded-2xl p-6 md:p-8 space-y-6">
            <div className="border-b border-[#2A2A2A] pb-4">
              <h2 className="text-base font-bold text-white">1. Identité de l'émission</h2>
              <p className="text-xs text-[#888888] mt-0.5">Le nom et la description permettront aux auditeurs de découvrir votre série.</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-[#888888] uppercase mb-2">
                  Nom de l'émission <span className="text-[#FFBF00]">*</span>
                </label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  placeholder="Ex: Les Voix du Mandé, Économie Bamako..."
                  className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl p-3.5 text-sm focus:border-[#FFBF00] outline-none text-white placeholder-[#555555]" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#888888] uppercase mb-2">
                  Résumé court (Slogan / Accroche)
                </label>
                <input 
                  type="text" 
                  name="descriptionShort" 
                  value={formData.descriptionShort} 
                  onChange={handleChange} 
                  placeholder="Ex: Le rendez-vous hebdomadaire des récits et traditions orales."
                  className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl p-3.5 text-sm focus:border-[#FFBF00] outline-none text-white placeholder-[#555555]" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#888888] uppercase mb-2">
                  Description complète <span className="text-[#FFBF00]">*</span>
                </label>
                <textarea 
                  name="description" 
                  rows={5} 
                  value={formData.description} 
                  onChange={handleChange} 
                  placeholder="Présentez le concept de l'émission, les thèmes abordés, le ton et la fréquence de diffusion..."
                  className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl p-3.5 text-sm focus:border-[#FFBF00] outline-none text-white placeholder-[#555555] resize-none" 
                />
              </div>
            </div>
          </div>

          {/* BLOC 2 : VISUELS */}
          <div className="bg-[#171717] border border-[#2A2A2A] rounded-2xl p-6 md:p-8 space-y-6">
            <div className="border-b border-[#2A2A2A] pb-4">
              <h2 className="text-base font-bold text-white">2. Identité visuelle</h2>
              <p className="text-xs text-[#888888] mt-0.5">Pochette carrée obligatoire et bannière d'en-tête facultative.</p>
            </div>

            <div className="space-y-6">
              {/* Pochette */}
              <div>
                <label className="block text-xs font-bold text-[#888888] uppercase mb-2">
                  Pochette carrée (1:1, min 1400×1400 px) <span className="text-[#FFBF00]">*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  <div className="w-28 h-28 shrink-0 bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl overflow-hidden flex items-center justify-center relative group">
                    {formData.cover ? (
                      <img src={formData.cover} alt="Aperçu pochette" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-[#444444]" />
                    )}
                    {uploadingCover && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-[#FFBF00] animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-3 w-full">
                    <input 
                      type="text" 
                      name="cover" 
                      value={formData.cover} 
                      onChange={handleChange} 
                      placeholder="URL directe de l'image (https://...)"
                      className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white placeholder-[#555555]" 
                    />
                    <label className="w-full flex items-center justify-center bg-[#0B0B0B] border border-[#2A2A2A] border-dashed text-white hover:bg-[#202020] rounded-lg h-10 px-4 cursor-pointer text-xs font-semibold transition-colors">
                      {uploadingCover ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin text-[#FFBF00]" /> Téléversement vers Cloudflare R2...</>
                      ) : (
                        <><UploadCloud className="w-4 h-4 mr-2 text-[#FFBF00]" /> Importer un fichier image (JPG, PNG, WebP)</>
                      )}
                      <input 
                        type="file" 
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden" 
                        disabled={uploadingCover}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageFile(file, "covers");
                        }} 
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Bannière */}
              <div className="pt-4 border-t border-[#2A2A2A]">
                <label className="block text-xs font-bold text-[#888888] uppercase mb-2">
                  Bannière de couverture (Optionnel, format paysage 16:9)
                </label>
                <div className="space-y-3">
                  <input 
                    type="text" 
                    name="banner" 
                    value={formData.banner} 
                    onChange={handleChange} 
                    placeholder="URL directe de la bannière (https://...)"
                    className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white placeholder-[#555555]" 
                  />
                  <label className="w-full flex items-center justify-center bg-[#0B0B0B] border border-[#2A2A2A] border-dashed text-white hover:bg-[#202020] rounded-lg h-10 px-4 cursor-pointer text-xs font-semibold transition-colors">
                    {uploadingBanner ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin text-[#FFBF00]" /> Téléversement de la bannière...</>
                    ) : (
                      <><UploadCloud className="w-4 h-4 mr-2 text-[#FFBF00]" /> Importer une bannière</>
                    )}
                    <input 
                      type="file" 
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden" 
                      disabled={uploadingBanner}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageFile(file, "banners");
                      }} 
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* BLOC 3 : CLASSIFICATION & LOCALISATION */}
          <div className="bg-[#171717] border border-[#2A2A2A] rounded-2xl p-6 md:p-8 space-y-6">
            <div className="border-b border-[#2A2A2A] pb-4">
              <h2 className="text-base font-bold text-white">3. Classification & Langues</h2>
              <p className="text-xs text-[#888888] mt-0.5">Catégorisez l'émission pour faciliter sa recommandation.</p>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-[#888888] uppercase mb-2">
                    Langue principale <span className="text-[#FFBF00]">*</span>
                  </label>
                  <select 
                    name="primaryLanguageCode" 
                    value={formData.primaryLanguageCode} 
                    onChange={handleChange}
                    className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl p-3 text-sm focus:border-[#FFBF00] outline-none text-white appearance-none"
                  >
                    {languages.map((l: any) => (
                      <option key={l.code} value={l.code}>{l.name} ({l.nativeName})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#888888] uppercase mb-2">
                    Pays d'origine
                  </label>
                  <select
                    name="countryId"
                    value={formData.countryId}
                    onChange={handleChange}
                    className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl p-3 text-sm focus:border-[#FFBF00] outline-none text-white appearance-none"
                  >
                    {countries.length === 0 && <option value="ML">Mali</option>}
                    {countries.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.flagEmoji ? `${c.flagEmoji} ` : ""}{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Langues secondaires */}
              <div>
                <label className="block text-xs font-bold text-[#888888] uppercase mb-2">
                  Langues secondaires (Optionnel)
                </label>
                <div className="flex flex-wrap gap-2">
                  {languages
                    .filter((l: any) => l.code !== formData.primaryLanguageCode)
                    .map((l: any) => {
                      const isSelected = formData.secondaryLanguageCodes.includes(l.code);
                      return (
                        <button
                          key={l.code}
                          type="button"
                          onClick={() => handleSecondaryLangToggle(l.code)}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                            isSelected
                              ? "bg-[#FFBF00]/15 border-[#FFBF00] text-[#FFBF00]"
                              : "bg-[#0B0B0B] border-[#2A2A2A] text-[#888888] hover:text-white"
                          }`}
                        >
                          {l.name}
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Catégories */}
              <div>
                <label className="block text-xs font-bold text-[#888888] uppercase mb-3">
                  Catégories (Sélectionnez au moins une catégorie)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {categories.map((c: any) => {
                    const isSelected = formData.categoryIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleCategoryToggle(c.id)}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-colors text-left ${
                          isSelected
                            ? "bg-[#FFBF00]/15 border-[#FFBF00] text-[#FFBF00]"
                            : "bg-[#0B0B0B] border-[#2A2A2A] text-white hover:border-[#555555]"
                        }`}
                      >
                        {c.icon && <span className="text-base">{c.icon}</span>}
                        <span className="truncate">{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ville */}
              <div>
                <label className="block text-xs font-bold text-[#888888] uppercase mb-2">
                  Ville d'enregistrement (Optionnel)
                </label>
                <input 
                  type="text" 
                  name="city" 
                  value={formData.city} 
                  onChange={handleChange} 
                  placeholder="Ex: Bamako, Ségou, Sikasso..."
                  className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl p-3 text-sm focus:border-[#FFBF00] outline-none text-white placeholder-[#555555]" 
                />
              </div>
            </div>
          </div>

          {/* BLOC 4 : GESTION & RESPONSABLE */}
          <div className="bg-[#171717] border border-[#2A2A2A] rounded-2xl p-6 md:p-8 space-y-6">
            <div className="border-b border-[#2A2A2A] pb-4">
              <h2 className="text-base font-bold text-white">4. Responsable & Propriété</h2>
              <p className="text-xs text-[#888888] mt-0.5">Attribution éditoriale et gestion des droits de l'émission.</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-[#888888] uppercase mb-2">
                  Organisation ou Créateur responsable
                </label>
                <select
                  name="organizationId"
                  value={formData.organizationId}
                  onChange={handleChange}
                  className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl p-3 text-sm focus:border-[#FFBF00] outline-none text-white appearance-none"
                >
                  <option value="">Aucune organisation (Créateur indépendant / Plateforme)</option>
                  {organizations.map((org: any) => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
                <p className="text-xs text-[#757575] mt-1.5">
                  Permet de regrouper les émissions par maison de production ou radio partenaire.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-[#888888] uppercase mb-2">
                    Statut de propriété
                  </label>
                  <select
                    name="ownershipStatus"
                    value={formData.ownershipStatus}
                    onChange={handleChange}
                    className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl p-3 text-sm focus:border-[#FFBF00] outline-none text-white appearance-none"
                  >
                    <option value="UNCLAIMED">Propriétaire non revendiqué (Géré par la plateforme)</option>
                    <option value="CLAIMED">Revendiqué (Propriétaire officiel authentifié)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#888888] uppercase mb-2">
                    Site web officiel (Optionnel)
                  </label>
                  <input 
                    type="url" 
                    name="website" 
                    value={formData.website} 
                    onChange={handleChange} 
                    placeholder="https://..."
                    className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl p-3 text-sm focus:border-[#FFBF00] outline-none text-white placeholder-[#555555]" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* BARRE D'ACTIONS DU FORMULAIRE */}
          <div className="bg-[#171717] border border-[#2A2A2A] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Button
              type="button"
              variant="ghost"
              disabled={isSubmitting}
              onClick={() => handleSave("STAY")}
              className="text-[#888888] hover:text-white text-xs w-full sm:w-auto"
            >
              <Save className="w-4 h-4 mr-2" /> Enregistrer le brouillon
            </Button>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => handleSave("DETAILS")}
                className="bg-[#1C1C1C] border-[#2A2A2A] text-white hover:bg-[#262626] text-xs font-semibold h-11 w-full sm:w-auto px-5"
              >
                Terminer sans épisode
              </Button>

              <Button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSave("NEW_EPISODE")}
                className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold text-xs h-11 w-full sm:w-auto px-6"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Création en cours...</>
                ) : (
                  <>Continuer vers le premier épisode <ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </div>
          </div>

        </div>

        {/* Colonne Aperçu en Direct (1/3 sur desktop, sous le formulaire sur mobile) */}
        <div className="w-full lg:w-80 shrink-0 sticky top-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#888888] uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-[#FFBF00]" /> Aperçu de l'émission
            </h3>
            <span className="text-[10px] text-[#FFBF00] bg-[#FFBF00]/10 px-2 py-0.5 rounded font-bold">
              En direct
            </span>
          </div>

          <div className="bg-[#171717] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-xl">
            {/* Bannière ou placeholder */}
            <div className="w-full h-24 bg-[#0B0B0B] relative overflow-hidden">
              {formData.banner ? (
                <img src={formData.banner} alt="Bannière" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#121212] flex items-center justify-center">
                  <span className="text-[10px] text-[#444444]">Bannière d'en-tête (Optionnelle)</span>
                </div>
              )}
            </div>

            <div className="p-5 space-y-4 -mt-10 relative">
              {/* Pochette avec ombre */}
              <div className="w-20 h-20 rounded-xl bg-[#0B0B0B] border-2 border-[#171717] overflow-hidden shadow-2xl relative">
                {formData.cover ? (
                  <img src={formData.cover} alt="Pochette" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#222222]">
                    <Radio className="w-6 h-6 text-[#555555]" />
                  </div>
                )}
              </div>

              {/* Titre & Slogan */}
              <div>
                <span className="inline-block text-[10px] font-bold text-[#FFBF00] uppercase mb-1">
                  {formatLabels[selectedFormat]}
                </span>
                <h4 className="text-base font-extrabold text-white leading-tight">
                  {formData.name || "Titre de l'émission"}
                </h4>
                <p className="text-xs text-[#888888] mt-1 line-clamp-2">
                  {formData.descriptionShort || formData.description || "Description de l'émission qui s'affichera sur Bamako Podcast..."}
                </p>
              </div>

              {/* Badges d'information */}
              <div className="pt-3 border-t border-[#2A2A2A] space-y-2 text-xs">
                <div className="flex items-center justify-between text-[#888888]">
                  <span>Langue</span>
                  <span className="text-white font-semibold">{formData.primaryLanguageCode.toUpperCase()}</span>
                </div>
                <div className="flex items-center justify-between text-[#888888]">
                  <span>Pays / Ville</span>
                  <span className="text-white font-semibold">{formData.countryId} {formData.city ? `(${formData.city})` : ""}</span>
                </div>
                <div className="flex items-center justify-between text-[#888888]">
                  <span>Responsable</span>
                  <span className="text-white font-semibold truncate max-w-[120px]">
                    {formData.ownershipStatus === "UNCLAIMED" ? "Non revendiqué" : "Revendiqué"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#888888]">
                  <span>Statut initial</span>
                  <span className="text-[#FFBF00] font-semibold">Brouillon</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-[#757575] text-center px-2">
            La création d'une émission ne publie aucun contenu tant qu'aucun épisode n'est validé et publié.
          </div>
        </div>

      </div>
    </div>
  );
}
