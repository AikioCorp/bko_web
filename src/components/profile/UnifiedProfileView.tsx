"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { useAuthStore } from "@/store/authStore";
import { usePlayerStore, PlayerEpisode } from "@/store/playerStore";
import { fetchApi } from "@/lib/api";
import {
  User, Mail, Phone, Shield, ShieldCheck, ShieldAlert,
  Crown, Mic2, Headphones, Laptop, Smartphone, Trash2,
  LogOut, Camera, Loader2, CheckCircle2, AlertCircle,
  ExternalLink, Save, BadgeCheck, Sparkles, Clock, Globe,
  Bookmark, Radio, Play, Pause, ListMusic, AlertTriangle,
  X, ChevronRight, LayoutDashboard, Settings2,
  Key, Lock, Eye, EyeOff
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

const fetcher = (url: string) => fetchApi(url).then((res) => res.data);

export function UnifiedProfileView({ portalContext = "public" }: UnifiedProfileViewProps) {
  const { user, isAuthenticated, logout, updateUser } = useAuthStore();
  const { currentEpisode, isPlaying, playEpisode, togglePlay } = usePlayerStore();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active tab: default to "dashboard" for a rich experience matching mobile, with tabs for settings
  const [activeTab, setActiveTab] = useState<"dashboard" | "general" | "devices" | "roles">("dashboard");

  // Form states
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Password management states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Avatar upload states
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Devices states
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [revokingDeviceId, setRevokingDeviceId] = useState<string | null>(null);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  // NATIVE MODALS STATES (Replaces browser confirm)
  const [showDeleteAvatarModal, setShowDeleteAvatarModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showLogoutAllModal, setShowLogoutAllModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  
  // Delete account confirmation
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);

  // Dashboard Data fetching (matching mobile app profile screen)
  const { data: savedData, isLoading: isLoadingSaved } = useSWR(isAuthenticated ? "/me/saved" : null, fetcher, { revalidateOnFocus: false });
  const { data: followingData, isLoading: isLoadingFollowing } = useSWR(isAuthenticated ? "/me/following" : null, fetcher, { revalidateOnFocus: false });
  const { data: playlistsData, isLoading: isLoadingPlaylists } = useSWR(isAuthenticated ? "/me/playlists" : null, fetcher, { revalidateOnFocus: false });
  const { data: historyData, isLoading: isLoadingHistory } = useSWR(isAuthenticated ? "/me/history" : null, fetcher, { revalidateOnFocus: false });
  const { data: continueListeningData } = useSWR(isAuthenticated ? "/me/continue-listening" : null, fetcher, { revalidateOnFocus: false });

  const savedList = Array.isArray(savedData) ? savedData : [];
  const followingList = Array.isArray(followingData) ? followingData : [];
  const playlistsList = Array.isArray(playlistsData) ? playlistsData : [];
  const historyList = Array.isArray(historyData) ? historyData : [];
  const continueList = Array.isArray(continueListeningData) ? continueListeningData : [];

  // Listening statistics calculations
  const totalListeningSeconds = historyList.reduce((acc: number, item: any) => acc + (item.positionSeconds || 0), 0);
  const completedEpisodesCount = historyList.filter((item: any) => item.completed).length;

  const formatListeningTime = (seconds: number) => {
    if (!seconds || seconds <= 0) return "0 min";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours} h ${minutes > 0 ? `${minutes} min` : ""}`;
    }
    return `${minutes} min`;
  };

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setPhoneNumber(user.phoneNumber || "");
    }
  }, [user]);

  // Load devices when on devices tab or initial
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
            Veuillez vous connecter avec votre compte pour accéder à votre espace et à vos réglages.
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

  // Password Update or Setup Handler
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 8) {
      setPasswordMsg({ type: "error", text: "Le nouveau mot de passe doit contenir au moins 8 caractères." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Les deux mots de passe ne correspondent pas." });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await fetchApi("/me/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: user?.hasPassword ? currentPassword : undefined,
          newPassword,
        }),
      });

      if (res.success) {
        setPasswordMsg({
          type: "success",
          text: user?.hasPassword
            ? "Votre mot de passe a été modifié avec succès."
            : "Votre mot de passe a été défini avec succès ! Vous pouvez désormais vous connecter directement avec votre email et ce mot de passe.",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        updateUser({ hasPassword: true });
      } else {
        setPasswordMsg({ type: "error", text: res.message || "Erreur lors de la mise à jour du mot de passe." });
      }
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message || "Impossible de mettre à jour le mot de passe." });
    } finally {
      setIsUpdatingPassword(false);
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

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "image/jpeg" },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error(`Erreur lors du téléversement (${uploadRes.status}).`);
      }

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

  // NATIVE: Remove Avatar (Triggered from in-app modal)
  const confirmRemoveAvatar = async () => {
    setShowDeleteAvatarModal(false);
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

  // NATIVE: Disconnect all other devices (Triggered from in-app modal)
  const confirmLogoutAll = async () => {
    setShowLogoutAllModal(false);
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

  // NATIVE: Delete Account (Triggered from in-app modal)
  const confirmDeleteAccount = async () => {
    if (deleteConfirmationText.trim().toUpperCase() !== "SUPPRIMER") {
      setDeleteAccountError("Veuillez saisir exactement le mot SUPPRIMER pour confirmer.");
      return;
    }

    setIsDeletingAccount(true);
    setDeleteAccountError(null);

    try {
      const res = await fetchApi("/me", {
        method: "DELETE",
      });

      if (res.success) {
        setShowDeleteAccountModal(false);
        logout();
        router.push("/?accountDeleted=true");
      } else {
        throw new Error(res.message || "Erreur lors de la suppression du compte.");
      }
    } catch (err: any) {
      setDeleteAccountError(err.message || "Impossible de supprimer le compte pour le moment.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const initialLetter = (user.fullName || "A").trim().charAt(0).toUpperCase();

  // Helper to play episode
  const handlePlayEpisode = (ep: any, startPosition: number = 0) => {
    const playerEp: PlayerEpisode = {
      id: ep.id,
      slug: ep.slug || ep.id,
      title: ep.title,
      cover: ep.coverImageUrl || ep.podcast?.coverImageUrl || null,
      durationSeconds: ep.durationSeconds || 0,
      podcast: {
        slug: ep.podcast?.slug || "",
        name: ep.podcast?.name || "Podcast",
        cover: ep.podcast?.coverImageUrl || "",
      },
      mediaSources: ep.mediaSources || [],
    };

    if (currentEpisode?.id === ep.id) {
      togglePlay();
    } else {
      playEpisode(playerEp, "AUDIO", startPosition);
    }
  };

  return (
    <div className="w-full space-y-6 pb-20">
      {/* Hidden file input for avatar */}
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
                    Auditeur Membre
                  </span>
                );
              })}
            </div>

            {/* Avatar action buttons (Native Modal trigger, zero browser confirm) */}
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
                  onClick={() => setShowDeleteAvatarModal(true)}
                  disabled={isUploadingAvatar}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#261717] border border-[#333333] text-[#f85149] rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Supprimer la photo
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

          {/* Quick Sign out button at top right (Native modal) */}
          <div className="shrink-0 self-center sm:self-start">
            <button
              onClick={() => setShowLogoutModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Se déconnecter</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation (Matching mobile features) */}
        <div className="border-t border-[#262626] pt-6 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "dashboard"
                ? "bg-[#FFBF00] text-black shadow"
                : "bg-[#181818] text-[#888888] hover:text-white border border-[#262626]"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Mon Espace (Tableau de bord)</span>
          </button>

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
            <span>Modifier mon profil</span>
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
            <span>Sécurité & Appareils ({devices.length || 1})</span>
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
            <span>Rôles & Studio ({user.roles.length})</span>
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

      {/* ===================================================================== */}
      {/* TAB 1: MON ESPACE (DASHBOARD COMME LE MOBILE) */}
      {/* ===================================================================== */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          
          {/* 4 Raccourcis Rapides avec compteurs réels (Exactement comme le mobile !) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {/* Raccourci 1: Enregistrés */}
            <Link
              href="/library?tab=saved"
              className="bg-[#121212] hover:bg-[#161616] border border-[#222222] hover:border-[#333333] p-4 rounded-2xl flex flex-col justify-between transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#1C1C1C] border border-[#2A2A2A] flex items-center justify-center text-[#FFBF00] group-hover:scale-105 transition-transform">
                <Bookmark className="w-5 h-5" />
              </div>
              <div className="mt-4">
                <div className="text-2xl font-black text-white tracking-tight">
                  {isLoadingSaved ? "..." : savedList.length}
                </div>
                <div className="text-xs text-[#888888] font-medium mt-0.5 flex items-center justify-between">
                  <span>À écouter plus tard</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#555555] group-hover:text-white transition-colors" />
                </div>
              </div>
            </Link>

            {/* Raccourci 2: Suivis */}
            <Link
              href="/library?tab=following"
              className="bg-[#121212] hover:bg-[#161616] border border-[#222222] hover:border-[#333333] p-4 rounded-2xl flex flex-col justify-between transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#1C1C1C] border border-[#2A2A2A] flex items-center justify-center text-[#38BDF8] group-hover:scale-105 transition-transform">
                <Radio className="w-5 h-5" />
              </div>
              <div className="mt-4">
                <div className="text-2xl font-black text-white tracking-tight">
                  {isLoadingFollowing ? "..." : followingList.length}
                </div>
                <div className="text-xs text-[#888888] font-medium mt-0.5 flex items-center justify-between">
                  <span>Émissions suivies</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#555555] group-hover:text-white transition-colors" />
                </div>
              </div>
            </Link>

            {/* Raccourci 3: Playlists */}
            <Link
              href="/library?tab=playlists"
              className="bg-[#121212] hover:bg-[#161616] border border-[#222222] hover:border-[#333333] p-4 rounded-2xl flex flex-col justify-between transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#1C1C1C] border border-[#2A2A2A] flex items-center justify-center text-[#34D399] group-hover:scale-105 transition-transform">
                <ListMusic className="w-5 h-5" />
              </div>
              <div className="mt-4">
                <div className="text-2xl font-black text-white tracking-tight">
                  {isLoadingPlaylists ? "..." : playlistsList.length}
                </div>
                <div className="text-xs text-[#888888] font-medium mt-0.5 flex items-center justify-between">
                  <span>Mes playlists</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#555555] group-hover:text-white transition-colors" />
                </div>
              </div>
            </Link>

            {/* Raccourci 4: Temps d'écoute cumulé */}
            <Link
              href="/library?tab=history"
              className="bg-[#121212] hover:bg-[#161616] border border-[#222222] hover:border-[#333333] p-4 rounded-2xl flex flex-col justify-between transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#1C1C1C] border border-[#2A2A2A] flex items-center justify-center text-[#F472B6] group-hover:scale-105 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
              <div className="mt-4">
                <div className="text-2xl font-black text-white tracking-tight truncate">
                  {isLoadingHistory ? "..." : formatListeningTime(totalListeningSeconds)}
                </div>
                <div className="text-xs text-[#888888] font-medium mt-0.5 flex items-center justify-between">
                  <span>Temps d'écoute total</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#555555] group-hover:text-white transition-colors" />
                </div>
              </div>
            </Link>
          </div>

          {/* Section: Reprendre l'écoute (In-progress episodes) */}
          {continueList.length > 0 && (
            <div className="bg-[#121212] border border-[#222222] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#202020] pb-3">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-[#FFBF00]" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Reprendre l'écoute ({continueList.length})
                  </h3>
                </div>
                <Link href="/library?tab=history" className="text-xs text-[#888888] hover:text-white">
                  Tout voir
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {continueList.slice(0, 4).map((item: any) => {
                  const ep = item.episode || item;
                  const progressPct = ep.durationSeconds && item.positionSeconds
                    ? Math.min(100, Math.round((item.positionSeconds / ep.durationSeconds) * 100))
                    : 0;

                  return (
                    <div
                      key={item.id || ep.id}
                      className="p-3.5 bg-[#171717] hover:bg-[#1C1C1C] border border-[#262626] rounded-xl flex items-center gap-3.5 transition-colors group"
                    >
                      <div className="relative w-14 h-14 rounded-lg bg-[#222222] overflow-hidden shrink-0">
                        {ep.coverImageUrl || ep.podcast?.coverImageUrl ? (
                          <img
                            src={ep.coverImageUrl || ep.podcast?.coverImageUrl}
                            alt={ep.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[#666666]">
                            BKO
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handlePlayEpisode(ep, item.positionSeconds || 0)}
                          className="absolute inset-0 bg-black/50 flex items-center justify-center text-[#FFBF00] opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Play className="w-6 h-6 fill-current" />
                        </button>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-white truncate group-hover:text-[#FFBF00] transition-colors">
                          {ep.title}
                        </h4>
                        <p className="text-[11px] text-[#888888] truncate mt-0.5">
                          {ep.podcast?.name || "Podcast"}
                        </p>
                        
                        {/* Progress Bar */}
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1 bg-[#282828] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#FFBF00]"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-[#777777] font-mono shrink-0">
                            {progressPct}%
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handlePlayEpisode(ep, item.positionSeconds || 0)}
                        className="w-8 h-8 rounded-full bg-[#FFBF00] text-black flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-transform"
                        title="Reprendre"
                      >
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Votre Activité & Bilan d'écoute */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-[#121212] border border-[#222222] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#202020] pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#FFBF00]" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Activité d'écoute réelle
                  </h3>
                </div>
                <span className="text-xs text-[#888888]">
                  Calculé sur vos sessions synchronisées
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center py-2">
                <div className="bg-[#171717] border border-[#242424] p-4 rounded-xl">
                  <span className="text-2xl font-black text-white block">
                    {historyList.length}
                  </span>
                  <span className="text-[11px] text-[#888888] font-medium mt-1 block">
                    Épisodes découverts
                  </span>
                </div>
                <div className="bg-[#171717] border border-[#242424] p-4 rounded-xl">
                  <span className="text-2xl font-black text-[#34D399] block">
                    {completedEpisodesCount}
                  </span>
                  <span className="text-[11px] text-[#888888] font-medium mt-1 block">
                    Épisodes terminés
                  </span>
                </div>
                <div className="bg-[#171717] border border-[#242424] p-4 rounded-xl">
                  <span className="text-2xl font-black text-[#FFBF00] block truncate">
                    {formatListeningTime(totalListeningSeconds)}
                  </span>
                  <span className="text-[11px] text-[#888888] font-medium mt-1 block">
                    Temps cumulé
                  </span>
                </div>
              </div>

              {historyList.length > 0 ? (
                <div className="pt-2">
                  <span className="text-xs text-[#888888] font-semibold block mb-2">
                    Dernières écoutes :
                  </span>
                  <div className="space-y-2">
                    {historyList.slice(0, 3).map((item: any) => {
                      const ep = item.episode || item;
                      return (
                        <div
                          key={item.id || ep.id}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-[#161616] border border-[#222222] text-xs"
                        >
                          <div className="min-w-0 flex-1 pr-3">
                            <span className="font-bold text-white truncate block">
                              {ep.title}
                            </span>
                            <span className="text-[11px] text-[#777777]">
                              {item.lastPlayedAt ? new Date(item.lastPlayedAt).toLocaleDateString("fr-FR") : "Récemment"}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handlePlayEpisode(ep, item.positionSeconds || 0)}
                            className="text-[#FFBF00] hover:underline text-[11px] font-bold shrink-0 flex items-center gap-1"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            Réécouter
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#777777] text-center py-4">
                  Aucun historique d'écoute pour l'instant. Lancez un épisode pour enrichir votre espace !
                </p>
              )}
            </div>

            {/* Quick Shortcuts & Creator Access */}
            <div className="space-y-4">
              <div className="bg-[#121212] border border-[#222222] rounded-2xl p-6 space-y-3">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FFBF00]" />
                  Pass & Studio
                </h3>

                <div className="space-y-2.5 pt-1">
                  <Link
                    href="/premium"
                    className="flex items-center justify-between p-3 rounded-xl bg-[#171717] hover:bg-[#202020] border border-[#262626] text-xs font-bold text-white transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-[#FFBF00]" />
                      Pass Premium
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#666666]" />
                  </Link>

                  {isCreator ? (
                    <Link
                      href="/studio"
                      className="flex items-center justify-between p-3 rounded-xl bg-[#171717] hover:bg-[#202020] border border-[#262626] text-xs font-bold text-white transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Mic2 className="w-4 h-4 text-[#34D399]" />
                        Mon Studio Créateur
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#666666]" />
                    </Link>
                  ) : (
                    <Link
                      href="/become-creator"
                      className="flex items-center justify-between p-3 rounded-xl bg-[#171717] hover:bg-[#202020] border border-[#262626] text-xs font-bold text-white transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Mic2 className="w-4 h-4 text-[#FFBF00]" />
                        Devenir Créateur
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#666666]" />
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveTab("general")}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-[#171717] hover:bg-[#202020] border border-[#262626] text-xs font-bold text-white transition-colors text-left"
                  >
                    <span className="flex items-center gap-2">
                      <Settings2 className="w-4 h-4 text-[#A0A0A0]" />
                      Modifier mes infos
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#666666]" />
                  </button>
                </div>
              </div>

              {/* Subscribed shows preview */}
              {followingList.length > 0 && (
                <div className="bg-[#121212] border border-[#222222] rounded-2xl p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Radio className="w-4 h-4 text-[#38BDF8]" />
                      Podcasts suivis
                    </h3>
                    <Link href="/library?tab=following" className="text-[11px] text-[#888888] hover:text-white">
                      Voir tout ({followingList.length})
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {followingList.slice(0, 5).map((pod: any) => (
                      <Link
                        key={pod.id}
                        href={`/podcasts/${pod.slug}`}
                        className="text-xs font-medium text-[#CCCCCC] bg-[#181818] hover:bg-[#222222] px-2.5 py-1 rounded-lg border border-[#262626] transition-colors truncate max-w-[150px]"
                      >
                        {pod.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: IDENTITÉ & INFORMATIONS */}
      {/* ===================================================================== */}
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
                  <span className="text-[#888888]">Identifiant</span>
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

            {/* Redirection vers Sécurité / Suppression de compte */}
            <div className="bg-[#181212] border border-red-950/40 rounded-2xl p-5 space-y-2">
              <span className="text-xs font-bold text-red-400 block">
                Supprimer votre compte ?
              </span>
              <p className="text-[11px] text-[#888888]">
                Vous pouvez gérer la suppression définitive de votre compte dans l'onglet Sécurité.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("devices");
                  setTimeout(() => {
                    document.getElementById("danger-zone")?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
                className="text-xs text-red-400 hover:text-red-300 font-bold underline inline-block pt-1"
              >
                Accéder à la zone de suppression →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: SÉCURITÉ, APPAREILS & ZONE DE DANGER (SUPPRIMER LE COMPTE) */}
      {/* ===================================================================== */}
      {activeTab === "devices" && (
        <div className="space-y-6">
          {/* CARTE: MOT DE PASSE & SÉCURITÉ DE CONNEXION */}
          <div className="bg-[#121212] border border-[#262626] rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="border-b border-[#262626] pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Key className="w-4 h-4 text-[#FFBF00]" />
                    <span>{user.hasPassword ? "Modifier mon mot de passe" : "Définir un mot de passe"}</span>
                  </h2>
                  <p className="text-xs text-[#888888] mt-1">
                    {user.hasPassword
                      ? "Mettez à jour le mot de passe utilisé pour vous connecter sur vos différents appareils."
                      : "Vous êtes actuellement connecté via Google. Définissez un mot de passe pour pouvoir vous connecter directement avec votre adresse e-mail sur n'importe quel ordinateur ou téléphone."}
                  </p>
                </div>
                <div className="shrink-0">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                    user.hasPassword
                      ? "bg-[#238636]/15 border border-[#238636]/30 text-[#3fb950]"
                      : "bg-[#FFBF00]/15 border border-[#FFBF00]/30 text-[#FFBF00]"
                  }`}>
                    {user.hasPassword ? "Mot de passe actif" : "Connexion Google uniquement"}
                  </span>
                </div>
              </div>
            </div>

            {passwordMsg && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                  passwordMsg.type === "success"
                    ? "bg-[#238636]/15 border-[#238636]/40 text-[#3fb950]"
                    : "bg-red-500/10 border-red-500/30 text-red-400"
                }`}
              >
                {passwordMsg.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-xl">
              {user.hasPassword && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white">Mot de passe actuel</label>
                  <div className="relative flex items-center">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[#181818] border border-[#262626] focus:border-[#FFBF00] text-white placeholder-[#555555] text-xs sm:text-sm rounded-xl py-2.5 px-3.5 pr-10 outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 text-[#757575] hover:text-white"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white">
                    {user.hasPassword ? "Nouveau mot de passe" : "Créer un mot de passe"}
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 caractères"
                      className="w-full bg-[#181818] border border-[#262626] focus:border-[#FFBF00] text-white placeholder-[#555555] text-xs sm:text-sm rounded-xl py-2.5 px-3.5 pr-10 outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 text-[#757575] hover:text-white"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white">Confirmer le mot de passe</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Répétez le mot de passe"
                    className="w-full bg-[#181818] border border-[#262626] focus:border-[#FFBF00] text-white placeholder-[#555555] text-xs sm:text-sm rounded-xl py-2.5 px-3.5 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="px-5 py-2.5 bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-extrabold text-xs rounded-xl shadow transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isUpdatingPassword ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{user.hasPassword ? "Mettre à jour le mot de passe" : "Enregistrer le mot de passe"}</span>
                </button>
              </div>
            </form>
          </div>

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
                  onClick={() => setShowLogoutAllModal(true)}
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

          {/* ZONE DE DANGER : SUPPRIMER LE COMPTE (Comme demandé expressément par l'utilisateur !) */}
          <div id="danger-zone" className="bg-[#181212] border border-red-900/40 rounded-2xl p-6 sm:p-8 space-y-5">
            <div className="border-b border-red-950/60 pb-4">
              <h2 className="text-base font-bold text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Zone de Danger &bull; Suppression définitive du compte
              </h2>
              <p className="text-xs text-[#AAAAAA] mt-1">
                La suppression de votre compte est définitive. Toutes vos données seront effacées irrévocablement.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-[#888888] leading-relaxed">
                Lorsque vous supprimez votre compte :
              </p>
              <ul className="text-xs text-[#AAAAAA] list-disc list-inside space-y-1">
                <li>Votre profil public, nom et photo seront supprimés.</li>
                <li>Vos playlists personnelles, podcasts suivis et épisodes sauvegardés seront effacés.</li>
                <li>Votre historique d'écoute et vos temps de lecture seront anonymisés.</li>
                <li>Toutes vos sessions sur tous vos appareils mobiles et ordinateurs seront révoquées immédiatement.</li>
              </ul>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmationText("");
                  setDeleteAccountError(null);
                  setShowDeleteAccountModal(true);
                }}
                className="px-5 py-2.5 bg-red-600/15 hover:bg-red-600/25 border border-red-600/30 text-red-400 hover:text-red-300 font-bold text-xs rounded-xl transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
                <span>Supprimer mon compte définitivement</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: RÔLES & PRIVILÈGES */}
      {/* ===================================================================== */}
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

      {/* ===================================================================== */}
      {/* NATIVE MODAL 1: SUPPRESSION DE LA PHOTO DE PROFIL */}
      {/* ===================================================================== */}
      {showDeleteAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl max-w-sm w-full p-6 space-y-5 shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-white">
                Supprimer votre photo de profil ?
              </h3>
              <p className="text-xs text-[#888888] leading-relaxed">
                Votre avatar personnalisé sera supprimé. Votre profil affichera l'initiale de votre nom par défaut.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteAvatarModal(false)}
                className="w-full py-2.5 rounded-xl bg-[#222222] hover:bg-[#2A2A2A] text-white text-xs font-bold transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmRemoveAvatar}
                className="w-full py-2.5 rounded-xl bg-[#DA3633] hover:bg-[#B62324] text-white text-xs font-bold transition-colors shadow-sm"
              >
                Supprimer la photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* NATIVE MODAL 2: DÉCONNEXION */}
      {/* ===================================================================== */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl max-w-sm w-full p-6 space-y-5 shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-white">
                Se déconnecter ?
              </h3>
              <p className="text-xs text-[#888888] leading-relaxed">
                Voulez-vous vraiment fermer votre session sur cet appareil ? Vous pourrez vous reconnecter à tout moment.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="w-full py-2.5 rounded-xl bg-[#222222] hover:bg-[#2A2A2A] text-white text-xs font-bold transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutModal(false);
                  logout();
                  router.push("/");
                }}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-sm"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* NATIVE MODAL 3: RÉVOQUER TOUTES LES SESSIONS */}
      {/* ===================================================================== */}
      {showLogoutAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl max-w-sm w-full p-6 space-y-5 shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-white">
                Déconnecter tous les autres appareils ?
              </h3>
              <p className="text-xs text-[#888888] leading-relaxed">
                Toutes les sessions actives sur vos téléphones, ordinateurs et tablettes seront révoquées immédiatement.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutAllModal(false)}
                className="w-full py-2.5 rounded-xl bg-[#222222] hover:bg-[#2A2A2A] text-white text-xs font-bold transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmLogoutAll}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-sm"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* NATIVE MODAL 4: SUPPRESSION DÉFINITIVE DU COMPTE */}
      {/* ===================================================================== */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#141414] border border-red-900/50 rounded-2xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl relative">
            
            <button
              onClick={() => setShowDeleteAccountModal(false)}
              className="absolute top-4 right-4 text-[#888888] hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-600/30 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-white">
                Supprimer votre compte définitivement
              </h3>
              <p className="text-xs text-[#AAAAAA] leading-relaxed">
                Cette action est <strong className="text-red-400">irréversible</strong>. Vos données d'écoute, favoris, abonnements et profils associés seront détruits.
              </p>
            </div>

            <div className="bg-[#1A1111] border border-red-900/30 rounded-xl p-3.5 text-xs space-y-2">
              <span className="font-bold text-red-300 block">
                Pour confirmer, tapez le mot <strong className="font-mono text-white bg-black/40 px-1.5 py-0.5 rounded border border-red-900/40">SUPPRIMER</strong> ci-dessous :
              </span>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="SUPPRIMER"
                className="w-full bg-[#120B0B] border border-red-900/50 rounded-lg py-2.5 px-3 text-xs font-mono font-bold text-white placeholder-red-900/60 outline-none focus:border-red-500 transition-colors"
                autoFocus
              />
            </div>

            {deleteAccountError && (
              <p className="text-xs text-red-400 bg-red-950/30 p-2.5 rounded-lg border border-red-900/40 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteAccountError}</span>
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteAccountModal(false)}
                disabled={isDeletingAccount}
                className="w-full py-2.5 rounded-xl bg-[#222222] hover:bg-[#2A2A2A] text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDeleteAccount}
                disabled={isDeletingAccount || deleteConfirmationText.trim().toUpperCase() !== "SUPPRIMER"}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-red-950 disabled:text-red-800 disabled:border-transparent text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                {isDeletingAccount ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Suppression...</span>
                  </>
                ) : (
                  <span>Supprimer mon compte</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
