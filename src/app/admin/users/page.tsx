"use client";

import React, { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import Link from "next/link";
import { adminApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import {
  Search,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Shield,
  Ban,
  BadgeCheck,
  Loader2,
  Trash2,
  AlertTriangle,
  Copy,
  Check,
  Calendar,
  Lock,
  Unlock,
  AlertOctagon,
  Users,
  UserCheck,
  Sparkles,
  Radio,
  Crown,
  KeyRound,
  MailCheck,
  ChevronRight,
  Filter,
  X,
  Activity,
  Edit3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminEditUserModal } from "@/components/admin/AdminEditUserModal";
import { AdminPasswordModal } from "@/components/admin/AdminPasswordModal";

function classNames(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

const SUSPEND_REASON_PRESETS = [
  "Non-respect des règles de la communauté",
  "Suspicion de fraude ou activité abusive",
  "Spam ou usurpation d'identité",
  "Demande explicite de l'utilisateur",
  "Violation répétée des droits d'auteur",
];

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
    icon: Users,
  },
};

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [activeTabFilter, setActiveTabFilter] = useState<"all" | "active" | "suspended" | "certified" | "admins">("all");
  const limit = 20;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  const fetcher = (url: string) => adminApi(url).then((res) => res.data);
  const { data: usersData, mutate, isLoading } = useSWR(
    `/admin/users?page=${page}&limit=${limit}${debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ""}`,
    fetcher
  );
  const { data: rolesData } = useSWR("/admin/assignable-roles", fetcher);

  // Panneau latéral
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [suspendReason, setSuspendReason] = useState("");
  const [isSuspended, setIsSuspended] = useState(false);
  const [isCreatorVerified, setIsCreatorVerified] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Modale de suppression
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Modale de blocage rapide
  const [userToSuspend, setUserToSuspend] = useState<any>(null);
  const [quickSuspendReason, setQuickSuspendReason] = useState("");
  const [isQuickSuspending, setIsQuickSuspending] = useState(false);

  // Modale d'édition et mot de passe
  const [userToEdit, setUserToEdit] = useState<any>(null);
  const [userToResetPassword, setUserToResetPassword] = useState<any>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const openUserPanel = (user: any) => {
    setSelectedUser(user);
    setUserRoles(user.roles || user.userRoles?.map((ur: any) => ur.role?.name || ur.role) || []);
    setIsSuspended(Boolean(user.isSuspended));
    setSuspendReason(user.suspendedReason || "");
    // ATTENTION : La certification créateur est basée STRICTEMENT sur isCreatorVerified (et non sur la validation email/OTP)
    setIsCreatorVerified(Boolean(user.isCreatorVerified ?? user.creatorProfile?.isVerified));
    setIsPanelOpen(true);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Mise à jour des rôles
  const handleUpdateRoles = async () => {
    if (!selectedUser) return;
    try {
      setIsUpdating(true);
      await adminApi(`/admin/users/${selectedUser.id}/roles`, {
        method: "PUT",
        body: JSON.stringify({ roles: userRoles }),
      });
      await mutate();
      showToast("Rôles mis à jour avec succès.");
    } catch (e: any) {
      alert("Erreur: " + e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Suspension / Blocage
  const handleToggleSuspension = async () => {
    if (!selectedUser) return;
    if (currentUser?.id === selectedUser.id) {
      alert("Impossible : vous ne pouvez pas bloquer votre propre compte administrateur.");
      return;
    }

    try {
      setIsUpdating(true);
      const nextSuspended = !isSuspended;
      await adminApi(`/admin/users/${selectedUser.id}/suspension`, {
        method: "POST",
        body: JSON.stringify({
          suspended: nextSuspended,
          reason: nextSuspended ? (suspendReason.trim() || "Bloqué par l'administration") : undefined,
        }),
      });

      setIsSuspended(nextSuspended);
      if (!nextSuspended) setSuspendReason("");
      await mutate();
      showToast(nextSuspended ? "Compte utilisateur suspendu avec succès." : "Accès du compte réactivé.");
    } catch (e: any) {
      alert("Erreur lors de la modification du statut : " + e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Blocage rapide
  const handleQuickSuspendSubmit = async () => {
    if (!userToSuspend) return;
    try {
      setIsQuickSuspending(true);
      const nextSuspended = !userToSuspend.isSuspended;
      await adminApi(`/admin/users/${userToSuspend.id}/suspension`, {
        method: "POST",
        body: JSON.stringify({
          suspended: nextSuspended,
          reason: nextSuspended ? (quickSuspendReason.trim() || "Bloqué par l'administration") : undefined,
        }),
      });
      await mutate();
      showToast(nextSuspended ? `Compte de ${userToSuspend.fullName} bloqué.` : `Compte de ${userToSuspend.fullName} réactivé.`);
      setUserToSuspend(null);
      setQuickSuspendReason("");
    } catch (e: any) {
      alert("Erreur: " + e.message);
    } finally {
      setIsQuickSuspending(false);
    }
  };

  // Certification Créateur MANUELLE (exclusivement gérée par le super admin, jamais automatique)
  const handleToggleCertification = async () => {
    if (!selectedUser) return;
    try {
      setIsUpdating(true);
      const nextVerified = !isCreatorVerified;
      await adminApi(`/admin/users/${selectedUser.id}/creator-verification`, {
        method: "POST",
        body: JSON.stringify({ verified: nextVerified }),
      });
      setIsCreatorVerified(nextVerified);
      await mutate();
      showToast(
        nextVerified
          ? "Badge officiel de créateur certifié attribué."
          : "Certification officielle de créateur retirée."
      );
    } catch (e: any) {
      alert("Erreur lors de la mise à jour de la certification : " + e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Suppression Définitive
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    if (currentUser?.id === userToDelete.id) {
      setDeleteError("Action impossible : vous ne pouvez pas supprimer votre propre compte.");
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteError(null);
      await adminApi(`/admin/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      await mutate();
      showToast(`Compte ${userToDelete.email} définitivement supprimé.`);

      if (selectedUser?.id === userToDelete.id) {
        setIsPanelOpen(false);
        setSelectedUser(null);
      }

      setUserToDelete(null);
      setDeleteConfirmationInput("");
    } catch (e: any) {
      setDeleteError(e.message || "Impossible de supprimer ce compte.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtrage local des données reçues
  const rawItems = usersData?.items || [];
  const filteredUsers = useMemo(() => {
    return rawItems.filter((u: any) => {
      const isSusp = Boolean(u.isSuspended);
      const isCert = Boolean(u.isCreatorVerified ?? u.creatorProfile?.isVerified);
      const roles = u.roles || u.userRoles?.map((ur: any) => ur.role?.name || ur.role) || [];
      const isAdmin = roles.some((r: string) => ["SUPER_ADMIN", "ADMIN"].includes(r));

      if (activeTabFilter === "active") return !isSusp;
      if (activeTabFilter === "suspended") return isSusp;
      if (activeTabFilter === "certified") return isCert;
      if (activeTabFilter === "admins") return isAdmin;
      return true;
    });
  }, [rawItems, activeTabFilter]);

  // Statistiques d'ensemble
  const stats = useMemo(() => {
    const total = usersData?.total || rawItems.length;
    const suspended = rawItems.filter((u: any) => u.isSuspended).length;
    const active = rawItems.filter((u: any) => !u.isSuspended).length;
    const certified = rawItems.filter((u: any) => u.isCreatorVerified ?? u.creatorProfile?.isVerified).length;
    const admins = rawItems.filter((u: any) => {
      const roles = u.roles || u.userRoles?.map((ur: any) => ur.role?.name || ur.role) || [];
      return roles.some((r: string) => ["SUPER_ADMIN", "ADMIN"].includes(r));
    }).length;
    return { total, active, suspended, certified, admins };
  }, [rawItems, usersData]);

  return (
    <div className="w-full pb-20">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161616] border border-[#2E2E2E] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-[#1DB954]" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header & Titre */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-white tracking-tight">Utilisateurs & Rôles</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#1C1C1C] text-[#AAAAAA] border border-[#282828]">
              {stats.total} membres
            </span>
          </div>
          <p className="text-[#888888] text-xs md:text-sm mt-1">
            Supervision des membres, attribution des privilèges RBAC, certification créateur et sécurité des comptes.
          </p>
        </div>

        {/* Barre de Recherche */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher nom, email, identifiant..."
            className="w-full bg-[#111111] border border-[#242424] rounded-xl pl-9 pr-9 py-2.5 text-xs md:text-sm text-white outline-none focus:border-[#444444] transition-colors placeholder:text-[#555555]"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777777] hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Cartes Métriques Synthétiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="p-4 rounded-xl bg-[#111111] border border-[#222222]">
          <div className="flex items-center justify-between text-[#888888] text-xs font-medium mb-1">
            <span>Comptes Actifs</span>
            <CheckCircle2 className="w-4 h-4 text-[#1DB954]" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.active}</div>
        </div>

        <div className="p-4 rounded-xl bg-[#111111] border border-[#222222]">
          <div className="flex items-center justify-between text-[#888888] text-xs font-medium mb-1">
            <span>Comptes Bloqués</span>
            <Ban className="w-4 h-4 text-[#EF4444]" />
          </div>
          <div className="text-2xl font-bold text-[#EF4444]">{stats.suspended}</div>
        </div>

        <div className="p-4 rounded-xl bg-[#111111] border border-[#222222]">
          <div className="flex items-center justify-between text-[#888888] text-xs font-medium mb-1">
            <span>Créateurs Certifiés</span>
            <BadgeCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400">{stats.certified}</div>
        </div>

        <div className="p-4 rounded-xl bg-[#111111] border border-[#222222]">
          <div className="flex items-center justify-between text-[#888888] text-xs font-medium mb-1">
            <span>Administrateurs</span>
            <Shield className="w-4 h-4 text-[#FFBF00]" />
          </div>
          <div className="text-2xl font-bold text-[#FFBF00]">{stats.admins}</div>
        </div>
      </div>

      {/* Onglets Filtres */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
        <button
          onClick={() => setActiveTabFilter("all")}
          className={classNames(
            "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0",
            activeTabFilter === "all"
              ? "bg-white text-black"
              : "bg-[#141414] text-[#888888] hover:text-white border border-[#242424]"
          )}
        >
          Tous ({rawItems.length})
        </button>
        <button
          onClick={() => setActiveTabFilter("active")}
          className={classNames(
            "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5",
            activeTabFilter === "active"
              ? "bg-[#1DB954] text-black"
              : "bg-[#141414] text-[#888888] hover:text-white border border-[#242424]"
          )}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Actifs
        </button>
        <button
          onClick={() => setActiveTabFilter("suspended")}
          className={classNames(
            "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5",
            activeTabFilter === "suspended"
              ? "bg-[#EF4444] text-white"
              : "bg-[#141414] text-[#888888] hover:text-white border border-[#242424]"
          )}
        >
          <Ban className="w-3.5 h-3.5" />
          Bloqués ({stats.suspended})
        </button>
        <button
          onClick={() => setActiveTabFilter("certified")}
          className={classNames(
            "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5",
            activeTabFilter === "certified"
              ? "bg-blue-500 text-white"
              : "bg-[#141414] text-[#888888] hover:text-white border border-[#242424]"
          )}
        >
          <BadgeCheck className="w-3.5 h-3.5" />
          Certifiés uniquement ({stats.certified})
        </button>
        <button
          onClick={() => setActiveTabFilter("admins")}
          className={classNames(
            "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5",
            activeTabFilter === "admins"
              ? "bg-[#FFBF00] text-black"
              : "bg-[#141414] text-[#888888] hover:text-white border border-[#242424]"
          )}
        >
          <Crown className="w-3.5 h-3.5" />
          Équipe Admin ({stats.admins})
        </button>
      </div>

      {/* Tableau des Utilisateurs */}
      <div className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#222222] bg-[#0A0A0A]">
                <th className="px-6 py-4 text-xs font-semibold text-[#888888] uppercase tracking-wider">Membre</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#888888] uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#888888] uppercase tracking-wider">Rôles RBAC</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#888888] uppercase tracking-wider">Statut & Badge</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#888888] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C1C1C]">
              {isLoading && !usersData ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-[#888888]">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-[#FFBF00]" />
                    Chargement des comptes utilisateurs...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-[#888888]">
                    Aucun utilisateur correspondant à ce filtre.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user: any) => {
                  const isCurrent = currentUser?.id === user.id;
                  const roles = user.roles || user.userRoles?.map((ur: any) => ur.role?.name || ur.role) || [];
                  const isCert = Boolean(user.isCreatorVerified ?? user.creatorProfile?.isVerified);

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-[#161616] transition-colors group cursor-pointer"
                      onClick={() => openUserPanel(user)}
                    >
                      {/* Membre */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover border border-[#2E2E2E]"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#1C1C1C] border border-[#2E2E2E] flex items-center justify-center font-bold text-white text-sm">
                              {user.fullName?.charAt(0).toUpperCase() || "?"}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-white flex items-center gap-1.5 text-sm">
                              {user.fullName || "Sans nom"}
                              {/* BADGE OFFICIEL : Apparaît UNIQUEMENT si le créateur est officiellement certifié */}
                              {isCert && (
                                <span title="Créateur Officiel Certifié">
                                  <BadgeCheck className="w-4 h-4 text-blue-400 shrink-0" />
                                </span>
                              )}
                              {isCurrent && (
                                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#222222] text-[#AAAAAA] ml-1">
                                  Vous
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#666666] font-mono mt-0.5 truncate max-w-[170px]">
                              {user.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-200">{user.email}</div>
                        {user.phoneNumber ? (
                          <div className="text-xs text-[#777777] mt-0.5 font-mono">{user.phoneNumber}</div>
                        ) : (
                          <div className="text-[11px] text-[#555555] mt-0.5">Aucun téléphone</div>
                        )}
                      </td>

                      {/* Rôles */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5 max-w-[240px]">
                          {roles.length > 0 ? (
                            roles.map((roleName: string) => {
                              const meta = ROLE_INFO_MAP[roleName] || {
                                label: roleName,
                                badgeBg: "bg-[#222222] border border-[#333333]",
                                badgeText: "text-gray-300",
                                icon: Users,
                              };
                              const Icon = meta.icon;
                              return (
                                <span
                                  key={roleName}
                                  className={classNames(
                                    "px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1",
                                    meta.badgeBg,
                                    meta.badgeText
                                  )}
                                >
                                  <Icon className="w-3 h-3" />
                                  {meta.label}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-xs text-[#555555]">Auditeur</span>
                          )}
                        </div>
                      </td>

                      {/* Statut & Badge */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          {user.isSuspended ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#2E1417] text-[#EF4444] border border-red-900/40">
                              <Ban className="w-3.5 h-3.5" /> Compte Bloqué
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#102A1A] text-[#1DB954] border border-emerald-900/40">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Actif
                            </span>
                          )}

                          {isCert ? (
                            <span className="text-[10px] font-semibold text-blue-400 flex items-center gap-1">
                              <BadgeCheck className="w-3 h-3" /> Créateur Certifié
                            </span>
                          ) : user.isEmailVerified ?? user.isVerified ? (
                            <span className="text-[10px] text-[#777777] flex items-center gap-1">
                              <MailCheck className="w-3 h-3 text-[#1DB954]" /> Email validé
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#666666]">Non certifié</span>
                          )}
                        </div>
                      </td>

                      {/* Actions Rapides */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {!isCurrent ? (
                            <>
                              {/* Bouton Bloquer / Débloquer rapide */}
                              <button
                                title={user.isSuspended ? "Débloquer le compte" : "Bloquer le compte"}
                                onClick={() => {
                                  setUserToSuspend(user);
                                  setQuickSuspendReason("");
                                }}
                                className={classNames(
                                  "p-2 rounded-lg transition-colors border text-xs font-medium",
                                  user.isSuspended
                                    ? "bg-[#142318] hover:bg-[#1B3021] text-[#1DB954] border-emerald-900/40"
                                    : "bg-[#1E1416] hover:bg-[#2A1B1D] text-[#EF4444] border-red-900/40"
                                )}
                              >
                                {user.isSuspended ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                              </button>

                              {/* Bouton Supprimer rapide */}
                              <button
                                title="Supprimer définitivement ce compte"
                                onClick={() => {
                                  setUserToDelete(user);
                                  setDeleteConfirmationInput("");
                                  setDeleteError(null);
                                }}
                                className="p-2 rounded-lg bg-[#141414] hover:bg-[#2A1517] text-[#888888] hover:text-[#EF4444] border border-[#242424] hover:border-red-900/40 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : null}

                          {/* Bouton Modifier l'utilisateur */}
                          <button
                            title="Modifier les informations de l'utilisateur"
                            onClick={() => setUserToEdit(user)}
                            className="p-2 rounded-lg bg-[#141414] hover:bg-[#202020] text-[#888888] hover:text-[#FFBF00] border border-[#242424] hover:border-[#FFBF00]/40 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Bouton Mot de passe & Sécurité */}
                          <button
                            title="Gérer / Réinitialiser le mot de passe"
                            onClick={() => setUserToResetPassword(user)}
                            className="p-2 rounded-lg bg-[#141414] hover:bg-[#202020] text-[#888888] hover:text-[#FFBF00] border border-[#242424] hover:border-[#FFBF00]/40 transition-colors"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Bouton Vue 360° */}
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="px-2.5 py-1.5 rounded-lg bg-[#251D08] hover:bg-[#382C0C] text-[#FFBF00] border border-[#FFBF00]/30 text-xs font-semibold transition-colors flex items-center gap-1.5"
                          >
                            <Activity className="w-3.5 h-3.5" />
                            <span>Vue 360°</span>
                          </Link>

                          {/* Bouton Gérer */}
                          <button
                            onClick={() => openUserPanel(user)}
                            className="px-3 py-1.5 rounded-lg bg-[#1F1F1F] hover:bg-[#282828] text-white text-xs font-semibold transition-colors border border-[#2E2E2E]"
                          >
                            Gérer
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {usersData && usersData.total > limit && (
          <div className="p-4 border-t border-[#222222] flex items-center justify-between bg-[#0A0A0A]">
            <span className="text-xs text-[#888888]">
              Affichage {((page - 1) * limit) + 1} - {Math.min(page * limit, usersData.total)} sur {usersData.total}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="bg-[#161616] text-white hover:bg-[#222222] border border-[#262626] text-xs"
              >
                Précédent
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={page * limit >= usersData.total}
                onClick={() => setPage(page + 1)}
                className="bg-[#161616] text-white hover:bg-[#222222] border border-[#262626] text-xs"
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Panel de Gestion Complète */}
      {isPanelOpen && selectedUser && (
        <>
          <div
            className="fixed inset-0 bg-black/75 z-40 transition-opacity backdrop-blur-sm"
            onClick={() => setIsPanelOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-[#111111] border-l border-[#242424] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Header du Panel */}
            <div className="p-6 border-b border-[#222222] flex items-center justify-between bg-[#0A0A0A]">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-[#FFBF00]" />
                <h2 className="text-lg font-bold text-white">Gestion du compte</h2>
              </div>
              <button
                onClick={() => setIsPanelOpen(false)}
                className="text-[#888888] hover:text-white p-1 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Corps du Panel */}
            <div className="flex-1 overflow-y-auto p-6 space-y-7">
              {/* Carte Utilisateur */}
              <div className="p-4 rounded-xl bg-[#161616] border border-[#262626]">
                <div className="flex items-start gap-4">
                  {selectedUser.avatar ? (
                    <img
                      src={selectedUser.avatar}
                      alt=""
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#333333] shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#1F1F1F] border-2 border-[#333333] flex items-center justify-center text-xl font-bold text-white shrink-0">
                      {selectedUser.fullName?.charAt(0).toUpperCase() || "?"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white truncate">{selectedUser.fullName || "Sans nom"}</h3>
                      {isCreatorVerified && <BadgeCheck className="w-4 h-4 text-blue-400 shrink-0" />}
                    </div>
                    <p className="text-xs text-[#888888] truncate mt-0.5">{selectedUser.email}</p>
                    {selectedUser.phoneNumber && (
                      <p className="text-xs text-[#777777] font-mono mt-0.5">{selectedUser.phoneNumber}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => handleCopyId(selectedUser.id)}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#202020] text-[#999999] hover:text-white text-[10px] font-mono border border-[#2C2C2C] transition-colors"
                      >
                        {copiedId ? <Check className="w-3 h-3 text-[#1DB954]" /> : <Copy className="w-3 h-3" />}
                        {copiedId ? "ID copié" : selectedUser.id}
                      </button>
                      {selectedUser.createdAt && (
                        <span className="text-[10px] text-[#666666] flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Inscrit le {new Date(selectedUser.createdAt).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bouton Fiche 360° */}
                <div className="mt-3 pt-3 border-t border-[#222222]">
                  <Link
                    href={`/admin/users/${selectedUser.id}`}
                    className="w-full py-2 px-3 rounded-xl bg-[#251D08] hover:bg-[#382C0C] text-[#FFBF00] border border-[#FFBF00]/30 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Activity className="w-4 h-4" />
                    <span>Ouvrir la Vue 360° Complète (Abonnements & Écoutes)</span>
                  </Link>
                </div>

                {/* Actions rapides d'édition et mot de passe */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setUserToEdit(selectedUser)}
                    className="py-2 px-3 rounded-xl bg-[#1C1C1C] hover:bg-[#262626] text-white border border-[#2E2E2E] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#FFBF00]" />
                    <span>Modifier profil</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserToResetPassword(selectedUser)}
                    className="py-2 px-3 rounded-xl bg-[#1C1C1C] hover:bg-[#262626] text-white border border-[#2E2E2E] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-[#FFBF00]" />
                    <span>Mot de passe</span>
                  </button>
                </div>
              </div>

              {/* État Actuel */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-[#888888] uppercase tracking-wider">Statut d'accès</h4>
                <div
                  className={classNames(
                    "p-3.5 rounded-xl border flex items-center justify-between",
                    isSuspended
                      ? "bg-[#201012] border-red-900/40 text-red-300"
                      : "bg-[#102014] border-emerald-900/40 text-emerald-300"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    {isSuspended ? (
                      <Ban className="w-5 h-5 text-[#EF4444] shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-[#1DB954] shrink-0" />
                    )}
                    <div>
                      <div className="text-sm font-bold text-white">
                        {isSuspended ? "Compte Suspendu (Bloqué)" : "Compte Actif"}
                      </div>
                      <div className="text-xs opacity-80 mt-0.5">
                        {isSuspended
                          ? (suspendReason ? `Raison: ${suspendReason}` : "Sessions révoquées et accès suspendu.")
                          : "Le membre peut se connecter et utiliser la plateforme."}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rôles RBAC avec descriptions claires */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-[#888888] uppercase tracking-wider">
                    Privilèges & Rôles
                  </h4>
                  <span className="text-[11px] text-[#666666]">
                    {userRoles.length} rôle(s) sélectionné(s)
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {rolesData?.map((role: any) => {
                    const isChecked = userRoles.includes(role.name);
                    const meta = ROLE_INFO_MAP[role.name];

                    return (
                      <label
                        key={role.name}
                        className={classNames(
                          "flex items-start gap-3 p-3.5 rounded-xl border transition-colors cursor-pointer",
                          isChecked
                            ? "bg-[#181818] border-[#3E3E3E]"
                            : "bg-[#131313] border-[#222222] hover:bg-[#171717]"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) setUserRoles([...userRoles, role.name]);
                            else setUserRoles(userRoles.filter((r) => r !== role.name));
                          }}
                          className="w-4 h-4 rounded bg-[#222222] border-[#444444] text-[#FFBF00] focus:ring-[#FFBF00] mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{role.name}</span>
                            {meta && (
                              <span
                                className={classNames(
                                  "px-2 py-0.2 rounded text-[10px] font-semibold uppercase",
                                  meta.badgeBg,
                                  meta.badgeText
                                )}
                              >
                                {meta.label}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#888888] mt-1 leading-relaxed">
                            {role.description || "Aucune description renseignée."}
                          </p>
                        </div>
                      </label>
                    );
                  })}

                  <Button
                    onClick={handleUpdateRoles}
                    disabled={isUpdating}
                    className="mt-1 bg-[#FFBF00] text-black hover:bg-[#E5AB00] font-bold text-xs py-2.5 rounded-xl"
                  >
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Enregistrer les rôles de l'utilisateur
                  </Button>
                </div>
              </div>

              {/* Certification Créateur (MANUELLE UNIQUEMENT) */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-[#888888] uppercase tracking-wider">
                  Certification Officielle Créateur
                </h4>
                <div className="p-4 rounded-xl border border-[#242424] bg-[#161616]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        {isCreatorVerified ? (
                          <>
                            <BadgeCheck className="w-4 h-4 text-blue-400" />
                            Créateur Officiellement Certifié
                          </>
                        ) : (
                          "Non certifié"
                        )}
                      </div>
                      <p className="text-xs text-[#888888] mt-1 leading-relaxed">
                        Cette certification attribue le badge bleu officiel. Elle n'est <strong>jamais automatique</strong> et relève exclusivement de la décision de l'administrateur.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleCertification}
                      disabled={isUpdating}
                      className={classNames(
                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                        isCreatorVerified ? "bg-blue-500" : "bg-[#333333]"
                      )}
                    >
                      <span
                        className={classNames(
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                          isCreatorVerified ? "translate-x-5" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* ZONE DE CONTRÔLE DE SÉCURITÉ */}
              <div className="space-y-4 pt-2 border-t border-[#222222]">
                <h4 className="text-xs font-bold text-[#EF4444] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" /> Zone de Sécurité & Modération
                </h4>

                {/* 1. Blocage / Déblocage */}
                <div className="p-4 rounded-xl border border-[#2E2426] bg-[#161112]">
                  <div className="flex items-center gap-2 mb-2">
                    {isSuspended ? (
                      <Unlock className="w-4 h-4 text-[#1DB954]" />
                    ) : (
                      <Lock className="w-4 h-4 text-[#EF4444]" />
                    )}
                    <span className="text-sm font-bold text-white">
                      {isSuspended ? "Débloquer l'accès" : "Bloquer l'accès au compte"}
                    </span>
                  </div>
                  <p className="text-xs text-[#888888] mb-3">
                    {isSuspended
                      ? "Rétablit l'accès pour ce compte. L'utilisateur pourra à nouveau se connecter."
                      : "Coupe immédiatement toutes les sessions actives et empêche toute nouvelle connexion."}
                  </p>

                  {!isSuspended && (
                    <div className="space-y-2 mb-3">
                      <div className="flex flex-wrap gap-1">
                        {SUSPEND_REASON_PRESETS.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setSuspendReason(preset)}
                            className={classNames(
                              "text-[10px] px-2 py-1 rounded border transition-colors",
                              suspendReason === preset
                                ? "bg-[#2E1417] text-red-300 border-red-800"
                                : "bg-[#141414] text-[#888888] border-[#2E2E2E] hover:text-white"
                            )}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        placeholder="Raison personnalisée..."
                        value={suspendReason}
                        onChange={(e) => setSuspendReason(e.target.value)}
                        className="w-full bg-[#111111] border border-[#2E2E2E] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-red-500"
                      />
                    </div>
                  )}

                  <Button
                    onClick={handleToggleSuspension}
                    disabled={isUpdating || currentUser?.id === selectedUser.id}
                    className={classNames(
                      "w-full text-xs font-bold transition-colors py-2.5 rounded-xl",
                      isSuspended
                        ? "bg-[#102A1A] hover:bg-[#183D26] text-[#1DB954] border border-emerald-900/50"
                        : "bg-[#2E1417] hover:bg-[#401B20] text-[#EF4444] border border-red-900/50"
                    )}
                  >
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {isSuspended ? "Débloquer le compte" : "Bloquer ce compte maintenant"}
                  </Button>
                </div>

                {/* 2. Suppression Définitive */}
                <div className="p-4 rounded-xl border border-red-900/40 bg-[#160E10]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Trash2 className="w-4 h-4 text-[#EF4444]" />
                    <span className="text-sm font-bold text-red-400">Suppression définitive du compte</span>
                  </div>
                  <p className="text-xs text-[#999999] mb-4 leading-relaxed">
                    Supprime l'intégralité du compte, ses sessions, ses préférences et ses données associées.
                    <strong className="text-white"> Cette action est irréversible.</strong>
                  </p>

                  {currentUser?.id === selectedUser.id ? (
                    <div className="p-3 rounded-lg bg-[#222222] text-[#888888] text-xs">
                      Vous ne pouvez pas supprimer votre propre compte administrateur.
                    </div>
                  ) : (
                    <Button
                      onClick={() => {
                        setUserToDelete(selectedUser);
                        setDeleteConfirmationInput("");
                        setDeleteError(null);
                      }}
                      className="w-full bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold text-xs py-2.5 rounded-xl"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer définitivement ce compte
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* MODALE DE CONFIRMATION DE SUPPRESSION DÉFINITIVE */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-md bg-[#141414] border border-[#2A2A2A] rounded-2xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#2E1417] border border-red-900/50 flex items-center justify-center text-[#EF4444] shrink-0">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Supprimer définitivement ce compte ?</h3>
                <p className="text-xs text-[#888888]">Opération irréversible de sécurité</p>
              </div>
            </div>

            {/* Détails Utilisateur */}
            <div className="p-3.5 rounded-xl bg-[#1A1A1A] border border-[#282828] mb-4">
              <div className="text-sm font-semibold text-white">{userToDelete.fullName}</div>
              <div className="text-xs text-[#AAAAAA] mt-0.5">{userToDelete.email}</div>
              <div className="text-[10px] text-[#666666] font-mono mt-1">ID: {userToDelete.id}</div>
            </div>

            <p className="text-xs text-[#AAAAAA] mb-4 leading-relaxed">
              Toutes les données associées (profil créateur, playlists, écoutes, avis, abonnements et jetons) seront
              immédiatement purgées de la base de données.
            </p>

            {deleteError && (
              <div className="p-3 rounded-lg bg-[#2E1417] border border-red-900/50 text-red-300 text-xs mb-4">
                {deleteError}
              </div>
            )}

            {/* Champ de confirmation */}
            <div className="space-y-1.5 mb-5">
              <label className="text-[11px] font-semibold text-[#888888] uppercase tracking-wider">
                Pour confirmer, saisissez l'adresse email exacte :
              </label>
              <input
                type="text"
                placeholder={userToDelete.email}
                value={deleteConfirmationInput}
                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500 font-mono"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setUserToDelete(null);
                  setDeleteConfirmationInput("");
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                className="bg-[#202020] hover:bg-[#2A2A2A] text-white text-xs font-semibold px-4 py-2 rounded-xl"
              >
                Annuler
              </Button>
              <Button
                onClick={handleDeleteUser}
                disabled={
                  isDeleting ||
                  deleteConfirmationInput.trim().toLowerCase() !== userToDelete.email.trim().toLowerCase()
                }
                className="bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold px-4 py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Trash2 className="w-4 h-4 mr-1.5" />}
                {isDeleting ? "Suppression en cours..." : "Confirmer la suppression"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE DE BLOCAGE RAPIDE */}
      {userToSuspend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-md bg-[#141414] border border-[#2A2A2A] rounded-2xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className={classNames(
                  "w-10 h-10 rounded-full border flex items-center justify-center shrink-0",
                  userToSuspend.isSuspended
                    ? "bg-[#102A1A] border-emerald-900/50 text-[#1DB954]"
                    : "bg-[#2E1417] border-red-900/50 text-[#EF4444]"
                )}
              >
                {userToSuspend.isSuspended ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {userToSuspend.isSuspended ? "Débloquer cet utilisateur ?" : "Bloquer cet utilisateur ?"}
                </h3>
                <p className="text-xs text-[#888888]">{userToSuspend.fullName} ({userToSuspend.email})</p>
              </div>
            </div>

            <p className="text-xs text-[#AAAAAA] mb-4 leading-relaxed">
              {userToSuspend.isSuspended
                ? "L'utilisateur sera réactivé et pourra se reconnecter sur l'application mobile et le site web."
                : "Toutes les sessions de l'utilisateur seront immédiatement révoquées et son accès sera bloqué."}
            </p>

            {!userToSuspend.isSuspended && (
              <div className="space-y-2 mb-5">
                <label className="text-[11px] font-semibold text-[#888888] uppercase tracking-wider">
                  Motif du blocage :
                </label>
                <div className="flex flex-wrap gap-1">
                  {SUSPEND_REASON_PRESETS.slice(0, 3).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setQuickSuspendReason(preset)}
                      className={classNames(
                        "text-[10px] px-2 py-1 rounded border transition-colors",
                        quickSuspendReason === preset
                          ? "bg-[#2E1417] text-red-300 border-red-800"
                          : "bg-[#141414] text-[#888888] border-[#2E2E2E] hover:text-white"
                      )}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Motif (ex: violation des règles)..."
                  value={quickSuspendReason}
                  onChange={(e) => setQuickSuspendReason(e.target.value)}
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 mt-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setUserToSuspend(null);
                  setQuickSuspendReason("");
                }}
                disabled={isQuickSuspending}
                className="bg-[#202020] hover:bg-[#2A2A2A] text-white text-xs font-semibold px-4 py-2 rounded-xl"
              >
                Annuler
              </Button>
              <Button
                onClick={handleQuickSuspendSubmit}
                disabled={isQuickSuspending}
                className={classNames(
                  "text-xs font-bold px-4 py-2 rounded-xl text-white",
                  userToSuspend.isSuspended ? "bg-[#1DB954] hover:bg-[#199E47]" : "bg-[#EF4444] hover:bg-[#DC2626]"
                )}
              >
                {isQuickSuspending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : userToSuspend.isSuspended ? (
                  <Unlock className="w-4 h-4 mr-1.5" />
                ) : (
                  <Lock className="w-4 h-4 mr-1.5" />
                )}
                {userToSuspend.isSuspended ? "Débloquer le compte" : "Bloquer le compte"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modale d'édition utilisateur */}
      <AdminEditUserModal
        isOpen={Boolean(userToEdit)}
        user={userToEdit}
        onClose={() => setUserToEdit(null)}
        onSuccess={async (updated) => {
          await mutate();
          if (selectedUser?.id === updated.id) {
            setSelectedUser((prev: any) => ({ ...prev, ...updated }));
          }
          showToast(`Informations de ${updated.fullName || updated.email} mises à jour.`);
        }}
      />

      {/* Modale de réinitialisation / mot de passe */}
      <AdminPasswordModal
        isOpen={Boolean(userToResetPassword)}
        user={userToResetPassword}
        onClose={() => setUserToResetPassword(null)}
        onSuccess={async () => {
          await mutate();
          showToast("Mot de passe mis à jour avec succès.");
        }}
      />
    </div>
  );
}
