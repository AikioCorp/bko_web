"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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

export default function EditPodcast() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

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

  const { data: rawPodcast, isLoading: isPodcastLoading } = useSWR(id ? `/admin/podcasts/${id}` : null, (url) => adminApi(url).then(res => res.data));

  useEffect(() => {
    if (rawPodcast) {
      setFormData({
        name: rawPodcast.name || "",
        descriptionShort: rawPodcast.shortDescription || "",
        description: rawPodcast.description || "",
        cover: rawPodcast.cover || "",
        banner: rawPodcast.banner || "",
        primaryLanguageCode: rawPodcast.primaryLanguageCode || "fr",
        secondaryLanguageCodes: rawPodcast.secondaryLanguageCodes || [],
        categoryIds: rawPodcast.categories?.map((c: any) => c.categoryId) || [],
        countryId: rawPodcast.countryId || "ML",
        city: rawPodcast.city || "",
        organizationId: rawPodcast.organizationId || "",
        ownershipStatus: rawPodcast.ownershipStatus || "UNCLAIMED",
        website: rawPodcast.website || "",
      });
      setSelectedFormat((rawPodcast.format || rawPodcast.defaultFormat || "AUDIO") as FormatChoice);
    }
  }, [rawPodcast]);

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

  // Enregistrement
  const handleSave = async () => {
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
      };

      const res = await adminApi(`/admin/podcasts/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });

      if (!res.success) throw new Error(res.message || "Erreur de modification de l'émission");

      router.push(`/admin/podcasts/${id}`);
    } catch (e: any) {
      setError(e.message || "Une erreur est survenue lors de l'enregistrement.");
      setIsSubmitting(false);
    }
  };

  const formatLabels = {
    AUDIO: "Émission audio",
    VIDEO: "Émission vidéo",
    HYBRID: "Émission audio & vidéo",
  };

  if (isPodcastLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[50vh] text-[#FFBF00]">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="mt-4 text-sm text-[#888888]">Chargement de l'émission...</span>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col pb-32 text-white animate-in fade-in duration-300">
      
      {/* Fil d'Ariane & Titre */}
      <div className="space-y-4 mb-8">
        <Link 
          href={`/admin/podcasts/${id}`}
          className="inline-flex items-center text-xs font-semibold text-[#888888] hover:text-[#FFBF00] transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Retour à l'émission
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#FFBF00] uppercase tracking-wider mb-1">
              <span>Édition</span>
              <span>•</span>
              <span>Informations générales</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              Modifier l'émission
            </h1>
            <p className="text-sm text-[#888888] mt-1">
              Mettez à jour l'identité, les visuels et la classification de l'émission.
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
          <div className="bg-[#171717] border border-[#2A2A2A] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-end gap-4">
            <Link
              href={`/admin/podcasts/${id}`}
              className="px-5 py-2.5 rounded-xl border border-[#2A2A2A] text-white text-xs font-semibold hover:bg-[#222222] transition-colors"
            >
              Annuler
            </Link>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={handleSave}
              className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold text-xs h-11 px-6"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Enregistrer les modifications</>
              )}
            </Button>
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
