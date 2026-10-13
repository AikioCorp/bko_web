"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import { adminApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Crown,
  BadgeCheck,
  Ban,
  CheckCircle2,
  Clock,
  Headphones,
  Radio,
  Sparkles,
  Heart,
  Bookmark,
  ListMusic,
  Smartphone,
  CreditCard,
  AlertTriangle,
  Trash2,
  Lock,
  Unlock,
  Copy,
  Check,
  RefreshCw,
  LogOut,
  SlidersHorizontal,
  Activity,
  Plus,
  X,
  ExternalLink,
  DollarSign,
  TrendingUp,
  Award,
  Globe,
  Bell,
  MessageSquare,
  ShieldAlert,
  Flame,
  FileBadge,
  Edit3,
  KeyRound
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminEditUserModal } from "@/components/admin/AdminEditUserModal";
import { AdminPasswordModal } from "@/components/admin/AdminPasswordModal";

function classNames(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

const ROLE_INFO_MAP: Record<string, { label: string; badgeBg: string; badgeText: string; icon: any }> = {
  SUPER_ADMIN: {
    label: "Super Admin",
    badgeBg: "bg-[#2E2405] border border-[#FFBF00]/40",
    badgeText: "text-[#FFBF00]",
    icon: Crown,
  },
  ADMIN: {
    label: "Admin",
    badgeBg: "bg-[#0F223D] border border-[#3B82F6]/40",
    badgeText: "text-[#60A5FA]",
    icon: Shield,
  },
  EDITOR: {
    label: "Éditeur",
    badgeBg: "bg-[#0E2C2C] border border-[#14B8A6]/40",
    badgeText: "text-[#2DD4BF]",
    icon: Sparkles,
  },
  CREATOR: {
    label: "Créateur",
    badgeBg: "bg-[#27153E] border border-[#A855F7]/40",
    badgeText: "text-[#C084FC]",
    icon: Radio,
  },
  USER: {
    label: "Auditeur",
    badgeBg: "bg-[#1E1E1E] border border-[#333333]",
    badgeText: "text-[#AAAAAA]",
    icon: User,
  },
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  ORANGE_MONEY: "Orange Money",
  WAVE: "Wave",
  MOOV_MONEY: "Moov Money",
  CARD: "Carte bancaire",
  ADMIN_GRANT: "Attribution Super Admin",
  FREE_TRIAL: "Essai gratuit",
};

export default function User360Page() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;
  const { user: currentUser } = useAuthStore();

  const [activeTab, setActiveTab] = useState<"monetization" | "listening" | "library" | "preferences" | "technical">("monetization");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Modales
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // État formulaire d'attribution d'abonnement
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [grantDurationDays, setGrantDurationDays] = useState(30);
  const [grantPaymentMethod, setGrantPaymentMethod] = useState("ADMIN_GRANT");
  const [grantNote, setGrantNote] = useState("");
  const [isGrantingSub, setIsGrantingSub] = useState(false);

  // État suspension
  const [suspendReason, setSuspendReason] = useState("");
  const [isSubmittingSuspension, setIsSubmittingSuspension] = useState(false);

  // État modification de rôles
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isSubmittingRoles, setIsSubmittingRoles] = useState(false);

  // État suppression
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Récupération des données 360
  const fetcher = (url: string) => adminApi(url).then((res) => res.data);
  const { data: user360, error, mutate, isLoading } = useSWR(
    userId ? `/admin/users/${userId}/360` : null,
    fetcher
  );

  // Récupération des plans d'abonnement disponibles
  const { data: subscriptionPlans } = useSWR(
    "/admin/subscription-plans",
    fetcher
  );

  // Récupération des rôles assignables
  const { data: assignableRoles } = useSWR(
    "/admin/assignable-roles",
    fetcher
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    showToast("Copié dans le presse-papier");
  };

  // Attribuer un abonnement
  const handleGrantSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId) return;
    try {
      setIsGrantingSub(true);
      await adminApi(`/admin/users/${userId}/subscriptions`, {
        method: "POST",
        body: JSON.stringify({
          planId: selectedPlanId,
          durationDays: grantDurationDays,
          paymentMethod: grantPaymentMethod,
          note: grantNote || "Abonnement offert par la direction",
        }),
      });
      await mutate();
      setIsGrantModalOpen(false);
      showToast("Abonnement activé avec succès pour cet utilisateur.");
    } catch (err: any) {
      showToast(err.message || "Erreur lors de l'attribution de l'abonnement");
    } finally {
      setIsGrantingSub(false);
    }
  };

  // Résilier un abonnement
  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm("Voulez-vous vraiment résilier cet abonnement ?")) return;
    try {
      await adminApi(`/admin/users/${userId}/subscriptions/${subscriptionId}/cancel`, {
        method: "POST",
        body: JSON.stringify({ note: "Révocation manuelle par le Super Admin" }),
      });
      await mutate();
      showToast("Abonnement résilié.");
    } catch (err: any) {
      showToast(err.message || "Erreur lors de la résiliation");
    }
  };

  // Bloquer / Débloquer
  const handleToggleSuspension = async () => {
    if (!user360?.profile) return;
    const isSusp = user360.profile.isSuspended;
    if (!isSusp && !suspendReason.trim()) {
      showToast("Veuillez indiquer un motif de blocage.");
      return;
    }
    try {
      setIsSubmittingSuspension(true);
      await adminApi(`/admin/users/${userId}/suspension`, {
        method: "POST",
        body: JSON.stringify({
          suspended: !isSusp,
          reason: !isSusp ? suspendReason.trim() : null,
        }),
      });
      await mutate();
      setIsSuspendModalOpen(false);
      setSuspendReason("");
      showToast(!isSusp ? "Compte utilisateur suspendu avec succès." : "Compte utilisateur réactivé.");
    } catch (err: any) {
      showToast(err.message || "Erreur lors de la modification du statut.");
    } finally {
      setIsSubmittingSuspension(false);
    }
  };

  // Mettre à jour les rôles
  const handleSaveRoles = async () => {
    try {
      setIsSubmittingRoles(true);
      await adminApi(`/admin/users/${userId}/roles`, {
        method: "PUT",
        body: JSON.stringify({ roles: selectedRoles }),
      });
      await mutate();
      setIsRolesModalOpen(false);
      showToast("Rôles RBAC mis à jour.");
    } catch (err: any) {
      showToast(err.message || "Erreur lors de la mise à jour des rôles.");
    } finally {
      setIsSubmittingRoles(false);
    }
  };

  // Forcer la déconnexion de tous les appareils
  const handleRevokeSessions = async () => {
    if (!confirm("Déconnecter immédiatement tous les appareils et sessions de cet utilisateur ?")) return;
    try {
      const res = await adminApi(`/admin/users/${userId}/sessions/revoke`, { method: "POST" });
      await mutate();
      showToast(`${res.data?.revokedCount || 0} session(s) révoquée(s).`);
    } catch (err: any) {
      showToast(err.message || "Erreur lors de la révocation des sessions.");
    }
  };

  // Supprimer définitivement
  const handleDeleteUser = async () => {
    if (deleteConfirmationInput !== user360?.profile?.email) {
      showToast("L'adresse email saisie ne correspond pas.");
      return;
    }
    try {
      setIsDeleting(true);
      await adminApi(`/admin/users/${userId}`, { method: "DELETE" });
      router.push("/admin/users");
    } catch (err: any) {
      showToast(err.message || "Impossible de supprimer ce compte.");
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center text-[#888888]">
        <RefreshCw className="w-8 h-8 animate-spin text-[#FFBF00] mb-4" />
        <p className="text-sm font-medium">Chargement du profil 360° utilisateur...</p>
      </div>
    );
  }

  if (error || !user360?.profile) {
    return (
      <div className="w-full py-16 text-center">
        <AlertTriangle className="w-12 h-12 text-[#EF4444] mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Utilisateur introuvable</h2>
        <p className="text-[#888888] text-sm mb-6">Ce profil n'existe pas ou vous n'avez pas l'autorisation d'y accéder.</p>
        <Link href="/admin/users">
          <Button className="bg-[#1C1C1C] hover:bg-[#282828] text-white border border-[#333333]">
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour à la liste des utilisateurs
          </Button>
        </Link>
      </div>
    );
  }

  const { profile, monetization, analytics, preferences, activity, technical } = user360;
  const isCurrent = currentUser?.id === profile.id;
  const activeSub = monetization.activeSubscription;

  return (
    <div className="w-full pb-24 text-white">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161616] border border-[#2E2E2E] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#1DB954]" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Barre Supérieure & Navigation Retour */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-xs md:text-sm text-[#888888] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tous les utilisateurs</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#666666] font-mono">ID: {profile.id}</span>
          <button
            onClick={() => copyToClipboard(profile.id, "id")}
            className="p-1.5 rounded-lg bg-[#141414] hover:bg-[#202020] text-[#777777] hover:text-white border border-[#242424]"
            title="Copier l'identifiant"
          >
            {copiedField === "id" ? <Check className="w-3.5 h-3.5 text-[#1DB954]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Header Fiche Profil 360° */}
      <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6 md:p-8 mb-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Identité */}
          <div className="flex items-start md:items-center gap-5">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt=""
                className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-2 border-[#2E2E2E] shrink-0"
              />
            ) : (
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#1C1C1C] border-2 border-[#2E2E2E] flex items-center justify-center font-bold text-white text-2xl shrink-0">
                {profile.fullName?.charAt(0).toUpperCase() || "?"}
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                  {profile.fullName || "Utilisateur sans nom"}
                </h1>
                {profile.isVerified && (
                  <span title="Compte vérifié">
                    <BadgeCheck className="w-6 h-6 text-blue-400" />
                  </span>
                )}
                {isCurrent && (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#222222] text-[#AAAAAA]">
                    Votre Compte
                  </span>
                )}
                {profile.isSuspended ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#2E1417] text-[#EF4444] border border-red-900/40">
                    <Ban className="w-3.5 h-3.5" /> Compte Suspendu
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#102A1A] text-[#1DB954] border border-emerald-900/40">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Actif
                  </span>
                )}
              </div>

              {/* Contact & Date */}
              <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-[#888888] mb-3">
                <div className="flex items-center gap-1.5 text-gray-300">
                  <Mail className="w-3.5 h-3.5 text-[#666666]" />
                  <span>{profile.email}</span>
                  <button
                    onClick={() => copyToClipboard(profile.email, "email")}
                    className="text-[#666666] hover:text-white ml-1"
                  >
                    {copiedField === "email" ? <Check className="w-3 h-3 text-[#1DB954]" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                {profile.phoneNumber && (
                  <div className="flex items-center gap-1.5 text-gray-300">
                    <Phone className="w-3.5 h-3.5 text-[#666666]" />
                    <span className="font-mono">{profile.phoneNumber}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-[#666666]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Inscrit le {new Date(profile.createdAt).toLocaleDateString("fr-FR")}</span>
                </div>
              </div>

              {/* Rôles RBAC */}
              <div className="flex flex-wrap items-center gap-2">
                {profile.roles?.length > 0 ? (
                  profile.roles.map((r: string) => {
                    const info = ROLE_INFO_MAP[r] || ROLE_INFO_MAP.USER;
                    const IconComponent = info.icon;
                    return (
                      <span
                        key={r}
                        className={classNames(
                          "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold",
                          info.badgeBg,
                          info.badgeText
                        )}
                      >
                        <IconComponent className="w-3.5 h-3.5" />
                        {info.label}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-xs text-[#666666]">Auditeur</span>
                )}

                {/* Profil créateur associé */}
                {profile.creatorProfile && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#1C162A] text-[#C084FC] border border-purple-900/40">
                    <Radio className="w-3.5 h-3.5" /> Créateur : {profile.creatorProfile.displayName}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Boutons d'Action Super Admin */}
          <div className="flex flex-wrap lg:flex-col items-center lg:items-end gap-2.5 shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0 border-[#1E1E1E]">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => {
                  setSelectedPlanId(subscriptionPlans?.[0]?.id || "");
                  setIsGrantModalOpen(true);
                }}
                className="bg-[#FFBF00] hover:bg-[#E6AC00] text-black font-semibold text-xs h-9 px-4 rounded-xl flex items-center gap-2 shadow-sm"
              >
                <CreditCard className="w-3.5 h-3.5" /> Attribuer un abonnement
              </Button>

              <Button
                onClick={() => setIsEditModalOpen(true)}
                className="bg-[#181818] hover:bg-[#242424] text-white border border-[#2E2E2E] text-xs h-9 px-3 rounded-xl flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#FFBF00]" /> Modifier profil
              </Button>

              <Button
                onClick={() => setIsPasswordModalOpen(true)}
                className="bg-[#181818] hover:bg-[#242424] text-white border border-[#2E2E2E] text-xs h-9 px-3 rounded-xl flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#FFBF00]" /> Mot de passe
              </Button>
            </div>

            {!isCurrent && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    setSelectedRoles(profile.roles || []);
                    setIsRolesModalOpen(true);
                  }}
                  className="bg-[#181818] hover:bg-[#242424] text-white border border-[#2E2E2E] text-xs h-9 px-3 rounded-xl flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5 text-[#3B82F6]" /> Modifier rôles
                </Button>

                <Button
                  onClick={() => setIsSuspendModalOpen(true)}
                  className={classNames(
                    "text-xs h-9 px-3 rounded-xl border flex items-center gap-1.5",
                    profile.isSuspended
                      ? "bg-[#142318] hover:bg-[#1B3021] text-[#1DB954] border-emerald-900/40"
                      : "bg-[#2A1517] hover:bg-[#381B1E] text-[#EF4444] border-red-900/40"
                  )}
                >
                  {profile.isSuspended ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  {profile.isSuspended ? "Débloquer" : "Bloquer"}
                </Button>

                <Button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="bg-[#141414] hover:bg-[#2A1517] text-[#888888] hover:text-[#EF4444] border border-[#242424] hover:border-red-900/40 text-xs h-9 px-3 rounded-xl"
                  title="Supprimer ce compte"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Motif de suspension affiché si bloqué */}
        {profile.isSuspended && (
          <div className="mt-5 p-3.5 rounded-xl bg-[#201012] border border-red-900/50 flex items-start gap-3 text-xs text-red-300">
            <AlertTriangle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Compte actuellement suspendu : </span>
              {profile.suspendedReason || "Aucun motif spécifié."}
              {profile.suspendedAt && (
                <span className="text-[#888888] ml-2">
                  (depuis le {new Date(profile.suspendedAt).toLocaleDateString("fr-FR")})
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cartes KPI 360° */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5 mb-6">
        {/* Temps d'écoute cumulé */}
        <div className="bg-[#111111] border border-[#222222] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#888888] mb-2">
            <span className="text-xs font-medium">Temps d'écoute</span>
            <Headphones className="w-4 h-4 text-[#FFBF00]" />
          </div>
          <div>
            <div className="text-xl md:text-2xl font-bold text-white tracking-tight">
              {analytics.totalListenHours}h
            </div>
            <div className="text-[11px] text-[#777777] mt-0.5">
              {Math.floor(analytics.totalListenSeconds / 60)} minutes cumulées
            </div>
          </div>
        </div>

        {/* Épisodes écoutés */}
        <div className="bg-[#111111] border border-[#222222] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#888888] mb-2">
            <span className="text-xs font-medium">Épisodes lancés</span>
            <Radio className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-xl md:text-2xl font-bold text-white tracking-tight">
              {analytics.totalListensCount}
            </div>
            <div className="text-[11px] text-emerald-400 font-medium mt-0.5">
              {analytics.completedListensCount} complétés ({analytics.completionRate}%)
            </div>
          </div>
        </div>

        {/* Monétisation / Dépenses */}
        <div className="bg-[#111111] border border-[#222222] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#888888] mb-2">
            <span className="text-xs font-medium">Monétisation</span>
            <CreditCard className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <div className="text-xl md:text-2xl font-bold text-white tracking-tight">
              {monetization.totalSpent.toLocaleString("fr-FR")} {monetization.currency}
            </div>
            <div className="text-[11px] mt-0.5 font-medium flex items-center gap-1">
              {activeSub ? (
                <span className="text-[#1DB954] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Abonné VIP
                </span>
              ) : (
                <span className="text-[#888888]">Formule gratuite</span>
              )}
            </div>
          </div>
        </div>

        {/* Bibliothèque & Favoris */}
        <div className="bg-[#111111] border border-[#222222] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#888888] mb-2">
            <span className="text-xs font-medium">Bibliothèque</span>
            <Bookmark className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="text-xl md:text-2xl font-bold text-white tracking-tight">
              {analytics.savedCount}
            </div>
            <div className="text-[11px] text-[#777777] mt-0.5">
              {analytics.playlistsCount} playlists créées
            </div>
          </div>
        </div>

        {/* Abonnements & Suivis */}
        <div className="col-span-2 md:col-span-4 lg:col-span-1 bg-[#111111] border border-[#222222] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#888888] mb-2">
            <span className="text-xs font-medium">Suivis</span>
            <Heart className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <div className="text-xl md:text-2xl font-bold text-white tracking-tight">
              {analytics.followsCount}
            </div>
            <div className="text-[11px] text-[#777777] mt-0.5">
              {analytics.creatorFollowsCount} créateurs suivis
            </div>
          </div>
        </div>
      </div>

      {/* Barre d'Onglets 360° */}
      <div className="flex items-center gap-2 border-b border-[#222222] pb-3 mb-6 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("monetization")}
          className={classNames(
            "px-4 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 flex items-center gap-2",
            activeTab === "monetization"
              ? "bg-[#FFBF00] text-black font-bold"
              : "bg-[#141414] text-[#888888] hover:text-white border border-[#242424]"
          )}
        >
          <CreditCard className="w-4 h-4" />
          Abonnements & Monétisation ({monetization.subscriptions?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("listening")}
          className={classNames(
            "px-4 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 flex items-center gap-2",
            activeTab === "listening"
              ? "bg-[#FFBF00] text-black font-bold"
              : "bg-[#141414] text-[#888888] hover:text-white border border-[#242424]"
          )}
        >
          <Headphones className="w-4 h-4" />
          Historique d'Écoute ({activity.recentPlaybackHistory?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("library")}
          className={classNames(
            "px-4 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 flex items-center gap-2",
            activeTab === "library"
              ? "bg-[#FFBF00] text-black font-bold"
              : "bg-[#141414] text-[#888888] hover:text-white border border-[#242424]"
          )}
        >
          <Bookmark className="w-4 h-4" />
          Favoris & Suivis ({analytics.savedCount + analytics.followsCount})
        </button>

        <button
          onClick={() => setActiveTab("preferences")}
          className={classNames(
            "px-4 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 flex items-center gap-2",
            activeTab === "preferences"
              ? "bg-[#FFBF00] text-black font-bold"
              : "bg-[#141414] text-[#888888] hover:text-white border border-[#242424]"
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Préférences & IA ({preferences.languages?.length + preferences.topics?.length})
        </button>

        <button
          onClick={() => setActiveTab("technical")}
          className={classNames(
            "px-4 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 flex items-center gap-2",
            activeTab === "technical"
              ? "bg-[#FFBF00] text-black font-bold"
              : "bg-[#141414] text-[#888888] hover:text-white border border-[#242424]"
          )}
        >
          <Smartphone className="w-4 h-4" />
          Appareils & Sécurité ({technical.devices?.length + technical.sessions?.length})
        </button>
      </div>

      {/* CONTENU ONGLET 1 : ABONNEMENTS & MONÉTISATION */}
      {activeTab === "monetization" && (
        <div className="space-y-6">
          {/* Bannière Abonnement Actif */}
          <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs uppercase font-bold tracking-wider text-[#FFBF00]">
                    Statut Actuel du Compte
                  </span>
                  {activeSub ? (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#102A1A] text-[#1DB954] border border-emerald-900/50">
                      ABONNEMENT ACTIF
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#1C1C1C] text-[#888888] border border-[#333333]">
                      ACCÈS GRATUIT STANDARD
                    </span>
                  )}
                </div>

                {activeSub ? (
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {activeSub.plan?.name || "Formule Premium"}
                    </h3>
                    <p className="text-sm text-[#888888]">
                      Valable du {new Date(activeSub.currentPeriodStart).toLocaleDateString("fr-FR")} jusqu'au{" "}
                      <span className="text-emerald-400 font-semibold">
                        {new Date(activeSub.currentPeriodEnd).toLocaleDateString("fr-FR")}
                      </span>{" "}
                      (Mode de règlement : {PAYMENT_METHOD_LABELS[activeSub.paymentMethod] || activeSub.paymentMethod})
                    </p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      Aucun abonnement payant actif
                    </h3>
                    <p className="text-sm text-[#888888]">
                      L'utilisateur a accès uniquement aux émissions gratuites. Il ne bénéficie pas des épisodes payants ou sans coupure publicitaire.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                {activeSub && (
                  <Button
                    onClick={() => handleCancelSubscription(activeSub.id)}
                    className="bg-[#2A1517] hover:bg-[#381B1E] text-[#EF4444] border border-red-900/40 text-xs h-9 px-4 rounded-xl"
                  >
                    Résilier l'abonnement
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setSelectedPlanId(subscriptionPlans?.[0]?.id || "");
                    setIsGrantModalOpen(true);
                  }}
                  className="bg-[#FFBF00] hover:bg-[#E6AC00] text-black font-semibold text-xs h-9 px-4 rounded-xl"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  {activeSub ? "Prolonger / Changer" : "Attribuer un forfait"}
                </Button>
              </div>
            </div>

            {/* Avantages actifs si abonné */}
            {activeSub?.plan?.features && (
              <div className="mt-5 pt-5 border-t border-[#1C1C1C] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {activeSub.plan.features.map((feat: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1DB954] shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tableau de l'historique des abonnements passés */}
          <div className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#222222] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Historique des Formules & Abonnements</h3>
                <p className="text-xs text-[#777777]">Tous les contrats souscrits ou attribués à cet utilisateur</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#222222] bg-[#0A0A0A] text-[#777777]">
                    <th className="px-6 py-3 font-semibold uppercase">Formule</th>
                    <th className="px-6 py-3 font-semibold uppercase">Période</th>
                    <th className="px-6 py-3 font-semibold uppercase">Prix</th>
                    <th className="px-6 py-3 font-semibold uppercase">Moyen de paiement</th>
                    <th className="px-6 py-3 font-semibold uppercase">Statut</th>
                    <th className="px-6 py-3 font-semibold uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C1C1C]">
                  {!monetization.subscriptions || monetization.subscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-[#777777]">
                        Aucun abonnement enregistré pour le moment.
                      </td>
                    </tr>
                  ) : (
                    monetization.subscriptions.map((sub: any) => {
                      const isSubActive = sub.status === "ACTIVE" && new Date(sub.currentPeriodEnd) > new Date();
                      return (
                        <tr key={sub.id} className="hover:bg-[#161616] transition-colors">
                          <td className="px-6 py-3 font-semibold text-white">
                            {sub.plan?.name || "Plan sans nom"}
                          </td>
                          <td className="px-6 py-3 text-gray-300">
                            {new Date(sub.currentPeriodStart).toLocaleDateString("fr-FR")} →{" "}
                            {new Date(sub.currentPeriodEnd).toLocaleDateString("fr-FR")}
                          </td>
                          <td className="px-6 py-3 font-mono text-gray-200">
                            {sub.plan?.price?.toLocaleString("fr-FR")} {sub.plan?.currency || "XOF"}
                          </td>
                          <td className="px-6 py-3 text-gray-300">
                            {PAYMENT_METHOD_LABELS[sub.paymentMethod] || sub.paymentMethod}
                          </td>
                          <td className="px-6 py-3">
                            {isSubActive ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#102A1A] text-[#1DB954] border border-emerald-900/40">
                                ACTIF
                              </span>
                            ) : sub.status === "CANCELED" ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#2A1517] text-[#EF4444] border border-red-900/40">
                                RÉSILIÉ
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1C1C1C] text-[#888888] border border-[#333333]">
                                EXPIRÉ
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3 text-right">
                            {isSubActive && (
                              <button
                                onClick={() => handleCancelSubscription(sub.id)}
                                className="text-red-400 hover:text-red-300 font-semibold"
                              >
                                Révoquer
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tableau des Transactions & Paiements */}
          <div className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#222222] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Journal des Transactions & Facturation</h3>
                <p className="text-xs text-[#777777]">Paiements d'abonnements, achats d'épisodes individuels et dons</p>
              </div>
              <span className="text-xs font-mono font-semibold text-[#FFBF00]">
                Total: {monetization.totalSpent.toLocaleString("fr-FR")} {monetization.currency}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#222222] bg-[#0A0A0A] text-[#777777]">
                    <th className="px-6 py-3 font-semibold uppercase">Date</th>
                    <th className="px-6 py-3 font-semibold uppercase">Référence</th>
                    <th className="px-6 py-3 font-semibold uppercase">Objet / Destination</th>
                    <th className="px-6 py-3 font-semibold uppercase">Passerelle</th>
                    <th className="px-6 py-3 font-semibold uppercase">Montant</th>
                    <th className="px-6 py-3 font-semibold uppercase text-right">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C1C1C]">
                  {!monetization.transactions || monetization.transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-[#777777]">
                        Aucune transaction financière effectuée.
                      </td>
                    </tr>
                  ) : (
                    monetization.transactions.map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-[#161616] transition-colors">
                        <td className="px-6 py-3 text-gray-300 whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleString("fr-FR")}
                        </td>
                        <td className="px-6 py-3 font-mono text-[#888888]">{tx.transactionRef || tx.id}</td>
                        <td className="px-6 py-3 text-white font-medium">
                          {tx.subscription?.plan?.name
                            ? `Abonnement : ${tx.subscription.plan.name}`
                            : tx.episode?.title
                            ? `Épisode : ${tx.episode.title}`
                            : tx.note || "Abonnement plateforme"}
                        </td>
                        <td className="px-6 py-3 text-gray-300">
                          {PAYMENT_METHOD_LABELS[tx.paymentMethod] || tx.paymentMethod}
                        </td>
                        <td className="px-6 py-3 font-mono font-semibold text-white">
                          {tx.amount.toLocaleString("fr-FR")} {tx.currency}
                        </td>
                        <td className="px-6 py-3 text-right">
                          {tx.status === "SUCCESS" ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#102A1A] text-[#1DB954] border border-emerald-900/40">
                              SUCCÈS
                            </span>
                          ) : tx.status === "FAILED" ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#2A1517] text-[#EF4444] border border-red-900/40">
                              ÉCHEC
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#262010] text-[#FFBF00] border border-amber-900/40">
                              EN ATTENTE
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONTENU ONGLET 2 : HISTORIQUE D'ÉCOUTE & ANALYTICS */}
      {activeTab === "listening" && (
        <div className="space-y-6">
          {/* Top Émissions Écoutées */}
          {analytics.topListenedPodcasts?.length > 0 && (
            <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-1">Émissions les plus consommées</h3>
              <p className="text-xs text-[#777777] mb-4">Classement des émissions selon le temps total écouté par ce membre</p>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
                {analytics.topListenedPodcasts.map((pod: any, idx: number) => (
                  <div key={pod.id} className="bg-[#161616] border border-[#262626] rounded-xl p-3 flex items-center gap-3">
                    <span className="font-bold text-sm text-[#FFBF00] w-4 text-center shrink-0">#{idx + 1}</span>
                    {pod.cover ? (
                      <img src={pod.cover} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-[#222222] flex items-center justify-center text-xs shrink-0 font-bold">
                        BKO
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <div className="text-xs font-semibold text-white truncate">{pod.name}</div>
                      <div className="text-[11px] text-[#888888]">
                        {Math.round((pod.totalSeconds / 60) * 10) / 10} min ({pod.plays} écoutes)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Liste détaillée des écoutes */}
          <div className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#222222] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Journal Chronologique des Écoutes</h3>
                <p className="text-xs text-[#777777]">Derniers épisodes lancés avec horodatage et progression exacte</p>
              </div>
              <span className="text-xs text-[#888888]">
                {activity.recentPlaybackHistory?.length || 0} écoutes récentes
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#222222] bg-[#0A0A0A] text-[#777777]">
                    <th className="px-6 py-3 font-semibold uppercase">Épisode</th>
                    <th className="px-6 py-3 font-semibold uppercase">Émission</th>
                    <th className="px-6 py-3 font-semibold uppercase">Dernière écoute</th>
                    <th className="px-6 py-3 font-semibold uppercase">Progression</th>
                    <th className="px-6 py-3 font-semibold uppercase text-right">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C1C1C]">
                  {!activity.recentPlaybackHistory || activity.recentPlaybackHistory.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-[#777777]">
                        Aucun épisode écouté pour le moment.
                      </td>
                    </tr>
                  ) : (
                    activity.recentPlaybackHistory.map((h: any, idx: number) => {
                      const ep = h.episode;
                      const duration = ep?.durationSeconds || 1;
                      const position = h.positionSeconds || 0;
                      const percent = Math.min(100, Math.round((position / duration) * 100));

                      return (
                        <tr key={idx} className="hover:bg-[#161616] transition-colors">
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              {ep?.cover ? (
                                <img src={ep.cover} alt="" className="w-9 h-9 rounded object-cover shrink-0" />
                              ) : (
                                <div className="w-9 h-9 rounded bg-[#222222] flex items-center justify-center shrink-0">
                                  <Headphones className="w-4 h-4 text-[#888888]" />
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-white truncate max-w-xs">{ep?.title || "Épisode"}</div>
                                {ep?.isPremium && (
                                  <span className="text-[10px] text-amber-400 font-bold uppercase flex items-center gap-1">
                                    <Crown className="w-3 h-3" /> Exclusivité Payante
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-gray-300">
                            {ep?.podcast?.name || "-"}
                          </td>
                          <td className="px-6 py-3 text-[#888888] whitespace-nowrap">
                            {new Date(h.lastPlayedAt).toLocaleString("fr-FR")}
                          </td>
                          <td className="px-6 py-3">
                            <div className="w-36">
                              <div className="flex items-center justify-between text-[10px] text-[#888888] mb-1">
                                <span>{Math.floor(position / 60)}m</span>
                                <span>{Math.floor(duration / 60)}m ({percent}%)</span>
                              </div>
                              <div className="w-full bg-[#222222] h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={classNames(
                                    "h-full rounded-full",
                                    percent >= 90 ? "bg-[#1DB954]" : "bg-[#FFBF00]"
                                  )}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-right">
                            {h.completed || percent >= 95 ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#102A1A] text-[#1DB954] border border-emerald-900/40">
                                TERMINÉ
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1C1C1C] text-[#AAAAAA] border border-[#333333]">
                                EN COURS
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONTENU ONGLET 3 : FAVORIS, PLAYLISTS & SUIVIS */}
      {activeTab === "library" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Épisodes Sauvegardés */}
          <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-blue-400" />
                  Épisodes Sauvegardés / Favoris
                </h3>
                <p className="text-xs text-[#777777]">Épisodes mis de côté pour une écoute ultérieure</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#1C1C1C] text-[#AAAAAA]">
                {activity.savedEpisodes?.length || 0}
              </span>
            </div>

            <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
              {!activity.savedEpisodes || activity.savedEpisodes.length === 0 ? (
                <p className="text-center py-10 text-xs text-[#666666]">Aucun épisode en favori.</p>
              ) : (
                activity.savedEpisodes.map((s: any, idx: number) => (
                  <div key={idx} className="bg-[#161616] border border-[#262626] rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {s.episode?.cover ? (
                        <img src={s.episode.cover} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-[#222222] flex items-center justify-center shrink-0">
                          <Headphones className="w-4 h-4 text-[#888888]" />
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <div className="text-xs font-semibold text-white truncate">{s.episode?.title}</div>
                        <div className="text-[11px] text-[#888888]">{s.episode?.podcast?.name || "-"}</div>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#666666] shrink-0">
                      {new Date(s.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Podcasts & Créateurs Suivis */}
          <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-400" />
                  Abonnements Émissions & Créateurs
                </h3>
                <p className="text-xs text-[#777777]">Flux suivis recevant des notifications</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#1C1C1C] text-[#AAAAAA]">
                {activity.podcastFollows?.length || 0} podcasts / {activity.creatorFollows?.length || 0} créateurs
              </span>
            </div>

            <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
              {activity.podcastFollows?.map((f: any, idx: number) => (
                <div key={idx} className="bg-[#161616] border border-[#262626] rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {f.podcast?.cover ? (
                      <img src={f.podcast.cover} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[#222222] flex items-center justify-center shrink-0">
                        <Radio className="w-4 h-4 text-[#888888]" />
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <div className="text-xs font-semibold text-white truncate">{f.podcast?.name}</div>
                      <div className="text-[11px] text-[#888888]">{f.podcast?._count?.episodes || 0} épisodes</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-[#1C1C1C] text-[#AAAAAA]">Podcast</span>
                </div>
              ))}

              {activity.creatorFollows?.map((cf: any, idx: number) => (
                <div key={`c-${idx}`} className="bg-[#161616] border border-[#262626] rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {cf.creatorProfile?.avatar ? (
                      <img src={cf.creatorProfile.avatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#222222] flex items-center justify-center shrink-0 font-bold text-xs">
                        {cf.creatorProfile?.displayName?.charAt(0) || "C"}
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <div className="text-xs font-semibold text-white truncate flex items-center gap-1">
                        {cf.creatorProfile?.displayName}
                        {cf.creatorProfile?.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />}
                      </div>
                      <div className="text-[11px] text-[#888888]">Créateur certifié</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-[#27153E] text-[#C084FC]">Créateur</span>
                </div>
              ))}

              {(!activity.podcastFollows || activity.podcastFollows.length === 0) &&
                (!activity.creatorFollows || activity.creatorFollows.length === 0) && (
                  <p className="text-center py-10 text-xs text-[#666666]">Aucun abonnement enregistré.</p>
                )}
            </div>
          </div>
        </div>
      )}

      {/* CONTENU ONGLET 4 : PRÉFÉRENCES & PROFIL IA */}
      {activeTab === "preferences" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Langues */}
          <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
              <Globe className="w-4 h-4 text-emerald-400" />
              Langues Préférées
            </h3>
            <p className="text-xs text-[#777777] mb-4">Langues sélectionnées lors du parcours d'onboarding</p>

            <div className="space-y-2">
              {!preferences.languages || preferences.languages.length === 0 ? (
                <p className="text-xs text-[#666666]">Aucune préférence linguistique définie.</p>
              ) : (
                preferences.languages.map((l: any, idx: number) => (
                  <div key={idx} className="bg-[#161616] border border-[#262626] rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white">{l.name}</div>
                      <div className="text-[11px] text-[#888888]">{l.nativeName || l.code}</div>
                    </div>
                    <span className="font-mono text-xs text-[#FFBF00] uppercase font-bold">{l.code}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Thématiques */}
          <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Centres d'Intérêt
            </h3>
            <p className="text-xs text-[#777777] mb-4">Thèmes suivis pour les recommandations personnalisées</p>

            <div className="flex flex-wrap gap-2">
              {!preferences.topics || preferences.topics.length === 0 ? (
                <p className="text-xs text-[#666666]">Aucun thème sélectionné.</p>
              ) : (
                preferences.topics.map((t: any, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1C1C1C] border border-[#2E2E2E] text-gray-200"
                  >
                    #{t.name}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
              <Bell className="w-4 h-4 text-purple-400" />
              Préférences de Notification
            </h3>
            <p className="text-xs text-[#777777] mb-4">Canaux autorisés pour les alertes</p>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#161616] border border-[#262626]">
                <span className="text-gray-300">Nouveaux épisodes par Email</span>
                <span className={preferences.notifications?.emailNewEpisodes !== false ? "text-[#1DB954] font-bold" : "text-[#EF4444]"}>
                  {preferences.notifications?.emailNewEpisodes !== false ? "Actif" : "Désactivé"}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#161616] border border-[#262626]">
                <span className="text-gray-300">Notifications Push Mobiles</span>
                <span className={preferences.notifications?.pushNewEpisodes !== false ? "text-[#1DB954] font-bold" : "text-[#EF4444]"}>
                  {preferences.notifications?.pushNewEpisodes !== false ? "Actif" : "Désactivé"}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#161616] border border-[#262626]">
                <span className="text-gray-300">Sélections Éditoriales BKO</span>
                <span className={preferences.notifications?.editorialHighlights !== false ? "text-[#1DB954] font-bold" : "text-[#EF4444]"}>
                  {preferences.notifications?.editorialHighlights !== false ? "Actif" : "Désactivé"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTENU ONGLET 5 : APPAREILS, SESSIONS & SÉCURITÉ */}
      {activeTab === "technical" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Sécurité & Connectivité</h3>
              <p className="text-xs text-[#777777]">Appareils enregistrés, sessions web en cours et journal d'audit</p>
            </div>
            <Button
              onClick={handleRevokeSessions}
              className="bg-[#2A1517] hover:bg-[#381B1E] text-[#EF4444] border border-red-900/40 text-xs h-9 px-4 rounded-xl flex items-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" /> Déconnecter tous les appareils
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Appareils Mobiles & Web */}
            <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#888888] mb-3">
                Appareils Enregistrés ({technical.devices?.length || 0})
              </h4>
              <div className="space-y-2.5">
                {!technical.devices || technical.devices.length === 0 ? (
                  <p className="text-xs text-[#666666] py-6 text-center">Aucun appareil enregistré.</p>
                ) : (
                  technical.devices.map((d: any) => (
                    <div key={d.id} className="bg-[#161616] border border-[#262626] rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-4 h-4 text-[#FFBF00]" />
                        <div>
                          <div className="text-xs font-semibold text-white">
                            {d.deviceModel || d.platform || "Appareil"}
                          </div>
                          <div className="text-[11px] text-[#777777]">
                            OS: {d.osVersion || "N/A"} • App: {d.appVersion || "v1.0"}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] text-[#666666]">
                        {new Date(d.lastActiveAt).toLocaleString("fr-FR")}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sessions actives */}
            <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#888888] mb-3">
                Sessions Web Actives ({technical.sessions?.length || 0})
              </h4>
              <div className="space-y-2.5">
                {!technical.sessions || technical.sessions.length === 0 ? (
                  <p className="text-xs text-[#666666] py-6 text-center">Aucune session active en base.</p>
                ) : (
                  technical.sessions.map((s: any) => (
                    <div key={s.id} className="bg-[#161616] border border-[#262626] rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-mono font-semibold text-white">{s.ipAddress || "IP masquée"}</div>
                        <div className="text-[11px] text-[#777777] truncate max-w-xs">{s.userAgent || "Navigateur"}</div>
                      </div>
                      <span className="text-[11px] text-[#666666]">
                        {new Date(s.createdAt).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Journal d'audit */}
          {technical.auditLogs?.length > 0 && (
            <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#888888] mb-3">
                Historique des Actions Administratives (Audit Logs)
              </h4>
              <div className="space-y-2 text-xs">
                {technical.auditLogs.map((log: any) => (
                  <div key={log.id} className="p-3 rounded-xl bg-[#161616] border border-[#242424] flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white">{log.action}</span>
                      <span className="text-[#888888] ml-2">par acteur ID: {log.actorId}</span>
                    </div>
                    <span className="text-[#666666] font-mono">{new Date(log.createdAt).toLocaleString("fr-FR")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODALE 1 : ATTRIBUER UN ABONNEMENT */}
      {isGrantModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#282828] rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#242424] mb-5">
              <div>
                <h3 className="text-lg font-bold text-white">Attribuer un Abonnement</h3>
                <p className="text-xs text-[#888888]">Pour {profile.fullName} ({profile.email})</p>
              </div>
              <button onClick={() => setIsGrantModalOpen(false)} className="text-[#777777] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGrantSubscription} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Formule d'abonnement
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  required
                  className="w-full bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                >
                  {subscriptionPlans?.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.price?.toLocaleString("fr-FR")} {p.currency} ({p.interval})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Durée d'activation (en jours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="3650"
                    value={grantDurationDays}
                    onChange={(e) => setGrantDurationDays(Number(e.target.value))}
                    className="w-full bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Mode d'enregistrement
                  </label>
                  <select
                    value={grantPaymentMethod}
                    onChange={(e) => setGrantPaymentMethod(e.target.value)}
                    className="w-full bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                  >
                    <option value="ADMIN_GRANT">Offert par l'Admin</option>
                    <option value="ORANGE_MONEY">Orange Money</option>
                    <option value="WAVE">Wave</option>
                    <option value="MOOV_MONEY">Moov Money</option>
                    <option value="CARD">Carte Bancaire</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Note administrative (facultative)
                </label>
                <textarea
                  rows={2}
                  value={grantNote}
                  onChange={(e) => setGrantNote(e.target.value)}
                  placeholder="Ex: Partenariat VIP, cadeau fidélité, paiement reçu au guichet..."
                  className="w-full bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl p-3 text-xs text-white outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#242424]">
                <Button
                  type="button"
                  onClick={() => setIsGrantModalOpen(false)}
                  className="bg-transparent hover:bg-[#222222] text-[#AAAAAA] text-xs h-9 px-4 rounded-xl"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isGrantingSub}
                  className="bg-[#FFBF00] hover:bg-[#E6AC00] text-black font-semibold text-xs h-9 px-5 rounded-xl"
                >
                  {isGrantingSub ? "Activation..." : "Valider et Activer"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE 2 : SUSPENSION / DÉBLOCAGE */}
      {isSuspendModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#282828] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">
              {profile.isSuspended ? "Débloquer ce compte" : "Bloquer l'accès utilisateur"}
            </h3>
            <p className="text-xs text-[#888888] mb-4">
              {profile.isSuspended
                ? "L'utilisateur pourra à nouveau se connecter et écouter ses émissions."
                : "L'utilisateur sera immédiatement déconnecté et ne pourra plus accéder à l'application."}
            </p>

            {!profile.isSuspended && (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Motif du blocage</label>
                <textarea
                  rows={3}
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Indiquez la raison du blocage..."
                  className="w-full bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl p-3 text-xs text-white outline-none resize-none"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <Button
                onClick={() => setIsSuspendModalOpen(false)}
                className="bg-transparent hover:bg-[#222222] text-[#AAAAAA] text-xs h-9 px-4 rounded-xl"
              >
                Annuler
              </Button>
              <Button
                onClick={handleToggleSuspension}
                disabled={isSubmittingSuspension}
                className={classNames(
                  "font-semibold text-xs h-9 px-4 rounded-xl",
                  profile.isSuspended ? "bg-[#1DB954] text-black" : "bg-[#EF4444] text-white"
                )}
              >
                {isSubmittingSuspension ? "Traitement..." : profile.isSuspended ? "Confirmer le déblocage" : "Confirmer le blocage"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE 3 : MODIFIER RÔLES RBAC */}
      {isRolesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#282828] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Modifier les Rôles RBAC</h3>
            <p className="text-xs text-[#888888] mb-4">Attribuez les privilèges système pour ce compte.</p>

            <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
              {assignableRoles?.map((r: any) => {
                const isSelected = selectedRoles.includes(r.name);
                return (
                  <label
                    key={r.name}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[#1C1C1C] border border-[#282828] cursor-pointer hover:border-[#383838]"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedRoles([...selectedRoles, r.name]);
                        else setSelectedRoles(selectedRoles.filter((x) => x !== r.name));
                      }}
                      className="accent-[#FFBF00] w-4 h-4 rounded"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">{r.name}</div>
                      <div className="text-[11px] text-[#888888]">{r.description}</div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button
                onClick={() => setIsRolesModalOpen(false)}
                className="bg-transparent hover:bg-[#222222] text-[#AAAAAA] text-xs h-9 px-4 rounded-xl"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSaveRoles}
                disabled={isSubmittingRoles}
                className="bg-[#FFBF00] hover:bg-[#E6AC00] text-black font-semibold text-xs h-9 px-4 rounded-xl"
              >
                {isSubmittingRoles ? "Enregistrement..." : "Enregistrer les rôles"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE 4 : SUPPRESSION DÉFINITIVE */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-red-900/60 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-3 text-[#EF4444]">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-white">Supprimer ce compte définitivement</h3>
            </div>
            <p className="text-xs text-[#AAAAAA] mb-4">
              Cette action est irréversible. Toutes les données associées (favoris, historique, sessions) seront supprimées de la base de données.
            </p>
            <p className="text-xs text-gray-300 mb-2">
              Veuillez taper <span className="font-mono font-bold text-white">{profile.email}</span> pour confirmer :
            </p>
            <input
              type="text"
              value={deleteConfirmationInput}
              onChange={(e) => setDeleteConfirmationInput(e.target.value)}
              placeholder={profile.email}
              className="w-full bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none mb-5 font-mono"
            />

            <div className="flex items-center justify-end gap-3">
              <Button
                onClick={() => setIsDeleteModalOpen(false)}
                className="bg-transparent hover:bg-[#222222] text-[#AAAAAA] text-xs h-9 px-4 rounded-xl"
              >
                Annuler
              </Button>
              <Button
                onClick={handleDeleteUser}
                disabled={isDeleting || deleteConfirmationInput !== profile.email}
                className="bg-[#EF4444] hover:bg-red-600 text-white font-semibold text-xs h-9 px-4 rounded-xl disabled:opacity-40"
              >
                {isDeleting ? "Suppression..." : "Supprimer définitivement"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modale d'édition utilisateur */}
      <AdminEditUserModal
        isOpen={isEditModalOpen}
        user={profile}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={async (updated) => {
          await mutate();
          showToast(`Informations de ${updated.fullName || updated.email} mises à jour.`);
        }}
      />

      {/* Modale de réinitialisation / mot de passe */}
      <AdminPasswordModal
        isOpen={isPasswordModalOpen}
        user={profile}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={async () => {
          await mutate();
          showToast("Mot de passe mis à jour avec succès.");
        }}
      />
    </div>
  );
}
