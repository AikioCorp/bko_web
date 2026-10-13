"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore, UserProfile } from "@/store/authStore";
import { fetchApi } from "@/lib/api";
import {
  User, Mail, Phone, Shield, ShieldCheck, ShieldAlert,
  Crown, Mic2, Headphones, Laptop, Smartphone, Trash2,
  LogOut, Camera, Loader2, CheckCircle2, AlertCircle,
  ExternalLink, Save, Key, BadgeCheck, Sparkles, Clock, Globe
} from "lucide-react";

interface UnifiedProfileViewProps {
  portalContext?: "admin" | "studio" | "public";
}

interface UserDevice {
  id: string;
  deviceType: string;
  deviceName?: string | null;
  lastActiveAt: string;
  createdAt: string;
  ipAddress?: string | null;
}

export function UnifiedProfileView({ portalContext = "public" }: UnifiedProfileViewProps) {
  const { user, isAuthenticated, logout, updateUser } = useAuthStore();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"general" | "roles" | "devices">("general");

  // Form states
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Avatar upload states
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Devices states
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [revokingDeviceId, setRevokingDeviceId] = useState<string | null>(null);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setPhoneNumber(user.phoneNumber || "");
    }
  }, [user]);

  // Load devices on mount or when tab switches to devices
  useEffect(() => {
    if (activeTab === "devices" || activeTab === "general") {
      loadDevices();
    }
  }, [activeTab]);

  const loadDevices = async () => {
    setIsLoadingDevices(true);
    try {
      const res = await fetchApi<UserDevice[]>("/me/devices");
      if (res.success && Array.isArray(res.data)) {
        setDevices(res.data);
      }
    } catch (_) {
      // Silently fall back
    } finally {
      setIsLoadingDevices(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-6">
        <div className="bg-[#121212] border border-[#262626] rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 bg-[#1A1A1A] border border-[#333333] rounded-2xl flex items-center justify-center mx-auto text-[#888888]">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-white">Connexion requise</h2>
          <p className="text-xs text-[#888888]">
            Veuillez vous connecter avec votre compte pour accéder aux paramètres de votre profil.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full py-3 bg-[#FFBF00] hover:bg-[#E5AC00] text-black font-extrabold text-xs rounded-xl transition-colors tracking-wide"
          >
            SE CONNECTER
          </Link>
        </div>
      </div>
    );
  }

  const isSuperAdmin = user.roles.some((r) => r.toUpperCase() === "SUPER_ADMIN");
  const isAdmin = user.roles.some((r) => r.toUpperCase() === "ADMIN");
  const isCreator = user.roles.some((r) => r.toUpperCase() === "CREATOR");

  // Save profile info
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setFeedbackMsg({ type: "error", text: "Le nom complet est obligatoire." });
      return;
    }

    setIsSaving(true);
    setFeedbackMsg(null);

    try {
      const res = await fetchApi("/me", {
        method: "PATCH",
        body: JSON.stringify({
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim() || undefined,
        }),
      });

      if (res.success) {
        updateUser({
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim() || null,
        });
        setFeedbackMsg({ type: "success", text: "Vos informations ont été enregistrées avec succès !" });
        setTimeout(() => setFeedbackMsg(null), 4000);
      } else {
        throw new Error(res.message || "Erreur lors de l'enregistrement.");
      }
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.message || "Impossible de mettre à jour le profil." });
    } finally {
      setIsSaving(false);
    }
  };

  // Avatar Upload Handler
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarError("Format invalide. Utilisez JPEG, PNG ou WebP.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setAvatarError("L'image ne doit pas dépasser 10 Mo.");
      return;
    }

    setIsUploadingAvatar(true);
    setAvatarError(null);

    try {
      // 1. Get presigned URL
      const initRes = await fetchApi("/media/images/upload-url", {
        method: "POST",
        body: JSON.stringify({
          mimeType: file.type || "image/jpeg",
          folder: "avatars",
          sizeBytes: file.size,
        }),
      });

      if (!initRes.success || !initRes.data?.uploadUrl) {
        throw new Error(initRes.message || "Impossible d'obtenir l'autorisation de téléversement.");
      }

      const { uploadUrl, publicUrl } = initRes.data;

      // 2. Direct binary PUT
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "image/jpeg" },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error(`Erreur lors du téléversement (${uploadRes.status}).`);
      }

      // 3. Update profile
      const patchRes = await fetchApi("/me", {
        method: "PATCH",
        body: JSON.stringify({ avatar: publicUrl }),
      });

      if (patchRes.success) {
        updateUser({ avatar: publicUrl });
        setFeedbackMsg({ type: "success", text: "Photo de profil mise à jour !" });
        setTimeout(() => setFeedbackMsg(null), 4000);
      }
    } catch (err: any) {
      setAvatarError(err.message || "Erreur lors du téléversement de la photo.");
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Remove Avatar
  const handleRemoveAvatar = async () => {
    if (!confirm("Voulez-vous supprimer votre photo de profil ?")) return;
    setIsUploadingAvatar(true);
    try {
      const res = await fetchApi("/me", {
        method: "PATCH",
        body: JSON.stringify({ avatar: "" }),
      });
      if (res.success) {
        updateUser({ avatar: null });
        setFeedbackMsg({ type: "success", text: "Photo de profil supprimée." });
        setTimeout(() => setFeedbackMsg(null), 4000);
      }
    } catch (_) {
      setAvatarError("Impossible de supprimer la photo.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Revoke device session
  const handleRevokeDevice = async (id: string) => {
    setRevokingDeviceId(id);
    try {
      const res = await fetchApi(`/me/devices/${id}`, { method: "DELETE" });
      if (res.success) {
        setDevices((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (_) {
    } finally {
      setRevokingDeviceId(null);
    }
  };

  // Disconnect all other devices
  const handleLogoutAll = async () => {
    if (!confirm("Êtes-vous sûr de vouloir déconnecter TOUS vos autres appareils actifs ?")) return;
    setIsLoggingOutAll(true);
    try {
      await fetchApi("/auth/logout-all", { method: "POST" });
      setDevices([]);
      setFeedbackMsg({ type: "success", text: "Toutes les autres sessions ont été révoquées." });
      setTimeout(() => setFeedbackMsg(null), 4000);
      loadDevices();
    } catch (_) {
    } finally {
      setIsLoggingOutAll(false);
    }
  };

  const initialLetter = (user.fullName || "A").trim().charAt(0).toUpperCase();

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-16">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleAvatarFileChange}
      />

      {/* Portal Context Banner */}
      {portalContext === "admin" && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#141414] border border-[#262626] rounded-xl text-xs">
          <div className="flex items-center gap-2 text-[#888888]">
            <Shield className="w-4 h-4 text-[#FFBF00]" />
            <span>Console d'Administration &bull; <strong className="text-white">Profil Privilégié</strong></span>
          </div>
          <Link
            href="/admin/dashboard"
            className="text-[#FFBF00] hover:underline font-bold flex items-center gap-1"
          >
            Tableau de bord <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}

      {portalContext === "studio" && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#141414] border border-[#262626] rounded-xl text-xs">
          <div className="flex items-center gap-2 text-[#888888]">
            <Mic2 className="w-4 h-4 text-[#FFBF00]" />
            <span>Espace Créateur &bull; <strong className="text-white">Studio Bamako Podcast</strong></span>
          </div>
          <Link
            href="/studio"
            className="text-[#FFBF00] hover:underline font-bold flex items-center gap-1"
          >
            Ouvrir mon Studio <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Main Identity Hero Card */}
      <div className="bg-[#121212] border border-[#262626] rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar Area with interactive picker */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#1A1A1A] border-2 border-[#333333] flex items-center justify-center overflow-hidden relative shadow-lg">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl font-black text-[#FFBF00] tracking-wider">
                  {initialLetter}
                </span>
              )}

              {/* Upload spinner overlay */}
              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-[#0B0B0B]/80 flex flex-col items-center justify-center gap-1 text-white">
                  <Loader2 className="w-6 h-6 text-[#FFBF00] animate-spin" />
                  <span className="text-[10px] font-bold text-gray-300">Envoi...</span>
                </div>
              )}
            </div>

            {/* Quick camera trigger icon badge */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              title="Téléverser une photo"
              className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl bg-[#FFBF00] hover:bg-[#E5AC00] text-black flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 border border-black/20"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* User details & Badges */}
          <div className="flex-1 space-y-3 text-center sm:text-left">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {user.fullName}
                </h1>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#238636]/15 border border-[#238636]/30 text-[#3fb950] text-[11px] font-bold self-center sm:self-auto">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  Compte Vérifié
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-xs text-[#888888] mt-1.5">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#666666]" />
                  {user.email}
                </span>
                {user.phoneNumber && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#666666]" />
                    {user.phoneNumber}
                  </span>
                )}
              </div>
            </div>

            {/* Role Badges with specific solid colors */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              {user.roles.map((r) => {
                const roleKey = r.toUpperCase();
                if (roleKey === "SUPER_ADMIN") {
                  return (
                    <span
                      key={r}
                      className="inline-flex items-center gap-1.5 bg-[#FFBF00]/15 text-[#FFBF00] border border-[#FFBF00]/30 text-[11px] font-black px-3 py-1 rounded-lg uppercase tracking-wide"
                    >
                      <Crown className="w-3 h-3 text-[#FFBF00]" />
                      Super Administrateur
                    </span>
                  );
                }
                if (roleKey === "ADMIN") {
                  return (
                    <span
                      key={r}
                      className="inline-flex items-center gap-1.5 bg-[#6366F1]/15 text-[#818CF8] border border-[#6366F1]/30 text-[11px] font-black px-3 py-1 rounded-lg uppercase tracking-wide"
                    >
                      <Shield className="w-3 h-3 text-[#818CF8]" />
                      Administrateur
                    </span>
                  );
                }
                if (roleKey === "CREATOR") {
                  return (
                    <span
                      key={r}
                      className="inline-flex items-center gap-1.5 bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30 text-[11px] font-black px-3 py-1 rounded-lg uppercase tracking-wide"
                    >
                      <Mic2 className="w-3 h-3 text-[#34D399]" />
                      Créateur Studio
                    </span>
                  );
                }
                return (
                  <span
                    key={r}
                    className="inline-flex items-center gap-1.5 bg-white/5 text-[#A3A3A3] border border-white/10 text-[11px] font-bold px-3 py-1 rounded-lg uppercase tracking-wide"
                  >
                    <Headphones className="w-3 h-3 text-[#A3A3A3]" />
                    Auditeur
                  </span>
                );
              })}
            </div>

            {/* Avatar action buttons */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#222222] border border-[#333333] text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
              >
                <Camera className="w-3.5 h-3.5 text-[#FFBF00]" />
                {isUploadingAvatar ? "Téléversement..." : "Changer la photo"}
              </button>
              {user.avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={isUploadingAvatar}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#261717] border border-[#333333] text-[#f85149] rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Supprimer
                </button>
              )}
            </div>

            {avatarError && (
              <p className="text-xs text-[#f85149] flex items-center gap-1 justify-center sm:justify-start">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {avatarError}
              </p>
            )}
          </div>

          {/* Quick Sign out button at top right */}
          <div className="shrink-0 self-center sm:self-start">
            <button
              onClick={() => {
                if (confirm("Voulez-vous vous déconnecter de votre compte ?")) {
                  logout();
                  router.push("/");
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Se déconnecter</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-t border-[#262626] pt-6 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "general"
                ? "bg-white text-black shadow"
                : "bg-[#181818] text-[#888888] hover:text-white border border-[#262626]"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Identité & Profil</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("roles")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "roles"
                ? "bg-white text-black shadow"
                : "bg-[#181818] text-[#888888] hover:text-white border border-[#262626]"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Rôles & Privilèges ({user.roles.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("devices")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "devices"
                ? "bg-white text-black shadow"
                : "bg-[#181818] text-[#888888] hover:text-white border border-[#262626]"
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Sécurité & Appareils ({devices.length})</span>
          </button>
        </div>
      </div>

      {/* Global Notifications */}
      {feedbackMsg && (
        <div
          className={`flex items-center gap-2.5 p-4 rounded-xl text-xs font-bold border transition-all ${
            feedbackMsg.type === "success"
              ? "bg-[#238636]/15 text-[#3fb950] border-[#238636]/30"
              : "bg-[#DA3633]/15 text-[#f85149] border-[#DA3633]/30"
          }`}
        >
          {feedbackMsg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* TAB 1: IDENTITÉ & INFORMATIONS */}
      {activeTab === "general" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Edit Form */}
          <div className="md:col-span-2 bg-[#121212] border border-[#262626] rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="border-b border-[#262626] pb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-[#FFBF00]" />
                Informations du compte
              </h2>
              <p className="text-xs text-[#888888] mt-1">
                Modifiez votre nom public et vos coordonnées associées à votre profil.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-[#CCCCCC] mb-1.5">
                  Nom complet
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#666666] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Votre nom et prénom"
                    className="w-full bg-[#181818] border border-[#262626] rounded-xl py-3 pl-10 pr-4 text-xs font-medium text-white outline-none focus:border-[#FFBF00] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#CCCCCC] mb-1.5 flex items-center justify-between">
                  <span>Adresse e-mail</span>
                  <span className="text-[10px] text-[#238636] font-bold flex items-center gap-1">
                    <BadgeCheck className="w-3 h-3" /> Vérifiée
                  </span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#666666] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full bg-[#141414] border border-[#262626] rounded-xl py-3 pl-10 pr-4 text-xs text-[#777777] cursor-not-allowed outline-none select-none"
                  />
                </div>
                <p className="text-[11px] text-[#666666] mt-1">
                  L'adresse e-mail est l'identifiant principal de sécurité et ne peut être modifiée qu'auprès du support.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#CCCCCC] mb-1.5">
                  Numéro de téléphone <span className="text-[#666666] font-normal">(facultatif)</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#666666] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+223 70 00 00 00"
                    className="w-full bg-[#181818] border border-[#262626] rounded-xl py-3 pl-10 pr-4 text-xs font-medium text-white outline-none focus:border-[#FFBF00] transition-colors"
                  />
                </div>
                <p className="text-[11px] text-[#666666] mt-1">
                  Permet la récupération par SMS ou les notifications de sécurité importantes.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-[#FFBF00] hover:bg-[#E5AC00] text-black font-extrabold text-xs rounded-xl transition-all shadow hover:shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Enregistrer les modifications</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Side Info Cards */}
          <div className="space-y-6">
            <div className="bg-[#121212] border border-[#262626] rounded-2xl p-6 space-y-4">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#FFBF00]" />
                État du compte
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
                  <span className="text-[#888888]">Identifiant Bko</span>
                  <span className="font-mono text-white text-[11px] truncate max-w-[120px]">{user.id}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
                  <span className="text-[#888888]">Rôle principal</span>
                  <span className="font-bold text-[#FFBF00]">
                    {isSuperAdmin ? "Super Admin" : isAdmin ? "Admin" : isCreator ? "Créateur" : "Auditeur"}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
                  <span className="text-[#888888]">Sessions actives</span>
                  <span className="font-bold text-white">{devices.length || 1} appareil(s)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#888888]">Authentification</span>
                  <span className="font-bold text-[#3fb950] flex items-center gap-1">
                    <BadgeCheck className="w-3 h-3" /> Token JWT
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#121212] border border-[#262626] rounded-2xl p-6 space-y-3">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FFBF00]" />
                Accès Rapides
              </h3>
              <div className="space-y-2">
                {isAdmin && (
                  <Link
                    href="/admin/dashboard"
                    className="flex items-center justify-between p-3 rounded-xl bg-[#181818] hover:bg-[#202020] border border-[#262626] text-xs font-bold text-white transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-[#818CF8]" />
                      Console d'administration
                    </span>
                    <ExternalLink className="w-3 h-3 text-[#666666]" />
                  </Link>
                )}
                {isCreator && (
                  <Link
                    href="/studio"
                    className="flex items-center justify-between p-3 rounded-xl bg-[#181818] hover:bg-[#202020] border border-[#262626] text-xs font-bold text-white transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Mic2 className="w-3.5 h-3.5 text-[#34D399]" />
                      Studio & Podcasts
                    </span>
                    <ExternalLink className="w-3 h-3 text-[#666666]" />
                  </Link>
                )}
                <Link
                  href="/library"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#181818] hover:bg-[#202020] border border-[#262626] text-xs font-bold text-white transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Headphones className="w-3.5 h-3.5 text-[#A3A3A3]" />
                    Ma bibliothèque d'écoute
                  </span>
                  <ExternalLink className="w-3 h-3 text-[#666666]" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RÔLES & PRIVILÈGES */}
      {activeTab === "roles" && (
        <div className="space-y-6">
          <div className="bg-[#121212] border border-[#262626] rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="border-b border-[#262626] pb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#FFBF00]" />
                Rôles attribués à votre compte
              </h2>
              <p className="text-xs text-[#888888] mt-1">
                Voici le détail des responsabilités et des privilèges attribués à votre identité.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.roles.map((r) => {
                const roleKey = r.toUpperCase();
                if (roleKey === "SUPER_ADMIN") {
                  return (
                    <div
                      key={r}
                      className="p-5 bg-[#16140E] border border-[#FFBF00]/30 rounded-2xl space-y-3 relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FFBF00]/20 text-[#FFBF00] font-black text-xs uppercase">
                          <Crown className="w-3.5 h-3.5" /> Super Admin
                        </span>
                        <span className="text-[10px] text-[#FFBF00] font-mono font-bold">ACCÈS TOTAL</span>
                      </div>
                      <p className="text-xs text-[#CCCCCC] leading-relaxed">
                        Contrôle intégral et gouvernance de la plateforme. Gestion des administrateurs, accès aux journaux d'audit, gestion des clés et déploiements système.
                      </p>
                      <div className="pt-2 flex gap-2">
                        <Link
                          href="/admin/audit"
                          className="px-3 py-1.5 rounded-lg bg-[#FFBF00]/10 hover:bg-[#FFBF00]/20 text-[#FFBF00] text-[11px] font-bold border border-[#FFBF00]/20 transition-colors"
                        >
                          Journal d'audit
                        </Link>
                        <Link
                          href="/admin/roles"
                          className="px-3 py-1.5 rounded-lg bg-[#FFBF00]/10 hover:bg-[#FFBF00]/20 text-[#FFBF00] text-[11px] font-bold border border-[#FFBF00]/20 transition-colors"
                        >
                          Gestion des rôles
                        </Link>
                      </div>
                    </div>
                  );
                }

                if (roleKey === "ADMIN") {
                  return (
                    <div
                      key={r}
                      className="p-5 bg-[#10121C] border border-[#6366F1]/30 rounded-2xl space-y-3 relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#6366F1]/20 text-[#818CF8] font-black text-xs uppercase">
                          <Shield className="w-3.5 h-3.5" /> Administrateur
                        </span>
                        <span className="text-[10px] text-[#818CF8] font-mono font-bold">MODÉRATION</span>
                      </div>
                      <p className="text-xs text-[#CCCCCC] leading-relaxed">
                        Gestion des catalogues éditoriaux, validation des podcasts, supervision de la régie publicitaire et modération des signalements communautaires.
                      </p>
                      <div className="pt-2 flex gap-2">
                        <Link
                          href="/admin/podcasts"
                          className="px-3 py-1.5 rounded-lg bg-[#6366F1]/10 hover:bg-[#6366F1]/20 text-[#818CF8] text-[11px] font-bold border border-[#6366F1]/20 transition-colors"
                        >
                          Podcasts & Épisodes
                        </Link>
                        <Link
                          href="/admin/reports"
                          className="px-3 py-1.5 rounded-lg bg-[#6366F1]/10 hover:bg-[#6366F1]/20 text-[#818CF8] text-[11px] font-bold border border-[#6366F1]/20 transition-colors"
                        >
                          Signalements
                        </Link>
                      </div>
                    </div>
                  );
                }

                if (roleKey === "CREATOR") {
                  return (
                    <div
                      key={r}
                      className="p-5 bg-[#0F1713] border border-[#10B981]/30 rounded-2xl space-y-3 relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#10B981]/20 text-[#34D399] font-black text-xs uppercase">
                          <Mic2 className="w-3.5 h-3.5" /> Créateur Vérifié
                        </span>
                        <span className="text-[10px] text-[#34D399] font-mono font-bold">STUDIO</span>
                      </div>
                      <p className="text-xs text-[#CCCCCC] leading-relaxed">
                        Publication et hébergement de vos émissions, diffusion d'épisodes audio et vidéo, import RSS automatisé et consultation des métriques d'écoute 30 jours.
                      </p>
                      <div className="pt-2 flex gap-2">
                        <Link
                          href="/studio"
                          className="px-3 py-1.5 rounded-lg bg-[#10B981]/10 hover:bg-[#10B981]/20 text-[#34D399] text-[11px] font-bold border border-[#10B981]/20 transition-colors"
                        >
                          Ouvrir mon Studio
                        </Link>
                        <Link
                          href="/studio/analytics"
                          className="px-3 py-1.5 rounded-lg bg-[#10B981]/10 hover:bg-[#10B981]/20 text-[#34D399] text-[11px] font-bold border border-[#10B981]/20 transition-colors"
                        >
                          Statistiques d'écoute
                        </Link>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={r}
                    className="p-5 bg-[#141414] border border-[#262626] rounded-2xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 text-[#A3A3A3] font-black text-xs uppercase">
                        <Headphones className="w-3.5 h-3.5" /> Auditeur Membre
                      </span>
                      <span className="text-[10px] text-[#888888] font-mono font-bold">UTILISATEUR</span>
                    </div>
                    <p className="text-xs text-[#888888] leading-relaxed">
                      Accès complet au catalogue Bamako Podcast, synchronisation de l'historique d'écoute, création de playlists et participation aux commentaires.
                    </p>
                    <div className="pt-2">
                      <Link
                        href="/library"
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold border border-white/10 transition-colors"
                      >
                        Accéder à ma bibliothèque
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SÉCURITÉ & APPAREILS */}
      {activeTab === "devices" && (
        <div className="space-y-6">
          <div className="bg-[#121212] border border-[#262626] rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262626] pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-[#FFBF00]" />
                  Appareils & Sessions Connectées
                </h2>
                <p className="text-xs text-[#888888] mt-1">
                  Surveillez et révoquez l'accès aux appareils actuellement connectés à votre compte.
                </p>
              </div>

              {devices.length > 1 && (
                <button
                  type="button"
                  onClick={handleLogoutAll}
                  disabled={isLoggingOutAll}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 shrink-0 self-start sm:self-auto"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Déconnecter tous les autres appareils</span>
                </button>
              )}
            </div>

            {isLoadingDevices ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <Loader2 className="w-6 h-6 text-[#FFBF00] animate-spin" />
                <p className="text-xs text-[#888888]">Chargement de vos appareils...</p>
              </div>
            ) : devices.length === 0 ? (
              <div className="py-8 text-center space-y-2 bg-[#181818] border border-[#262626] rounded-xl p-6">
                <Laptop className="w-6 h-6 text-[#666666] mx-auto" />
                <p className="text-xs text-white font-bold">Aucune autre session active détectée</p>
                <p className="text-[11px] text-[#888888]">Votre compte est actuellement utilisé uniquement sur cette fenêtre.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {devices.map((device, index) => {
                  const isMobile =
                    device.deviceType === "ANDROID" ||
                    device.deviceType === "IOS" ||
                    device.deviceType?.toLowerCase().includes("mobile");

                  return (
                    <div
                      key={device.id || index}
                      className="bg-[#181818] border border-[#262626] rounded-xl p-4 flex items-center justify-between gap-4 transition-colors hover:border-[#333333]"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-[#202020] border border-[#333333] flex items-center justify-center text-[#FFBF00] shrink-0">
                          {isMobile ? (
                            <Smartphone className="w-5 h-5" />
                          ) : (
                            <Laptop className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white">
                              {device.deviceName || (isMobile ? "Appareil Mobile" : "Navigateur Web")}
                            </h4>
                            {index === 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-[#238636]/15 border border-[#238636]/30 text-[#3fb950] text-[9.5px] font-black uppercase">
                                Session en cours
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-[#777777] mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Dernière activité : {new Date(device.lastActiveAt).toLocaleString("fr-FR")}
                            </span>
                            {device.ipAddress && (
                              <span className="flex items-center gap-1 font-mono">
                                <Globe className="w-3 h-3" />
                                {device.ipAddress}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {index !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleRevokeDevice(device.id)}
                          disabled={revokingDeviceId === device.id}
                          title="Révoquer cet appareil"
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          {revokingDeviceId === device.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
