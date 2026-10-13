"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { adminApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import {
  Search,
  ShieldAlert,
  CheckCircle,
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
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";

function classNames(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

const SUSPEND_REASON_PRESETS = [
  "Non-respect des règles de la plateforme",
  "Suspicion de fraude ou activité suspecte",
  "Spam ou abus de signalement",
  "Demande explicite de l'utilisateur",
  "Violation des droits d'auteur",
];

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");
  const limit = 20;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
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
  const [isVerified, setIsVerified] = useState(false);
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

  // Toast temporaire
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const openUserPanel = (user: any) => {
    setSelectedUser(user);
    setUserRoles(user.userRoles?.map((ur: any) => ur.role?.name || ur.role) || []);
    setIsSuspended(Boolean(user.isSuspended));
    setSuspendReason(user.suspendedReason || "");
    setIsVerified(Boolean(user.isVerified));
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

  // Blocage / Déblocage depuis le panneau latéral
  const handleToggleSuspension = async () => {
    if (!selectedUser) return;
    if (currentUser?.id === selectedUser.id) {
      alert("Impossible : vous ne pouvez pas bloquer votre propre compte.");
      return;
    }

    try {
      setIsUpdating(true);
      const nextSuspended = !isSuspended;
      const res = await adminApi(`/admin/users/${selectedUser.id}/suspension`, {
        method: "POST",
        body: JSON.stringify({
          suspended: nextSuspended,
          reason: nextSuspended ? (suspendReason.trim() || "Bloqué par l'administration") : undefined,
        }),
      });

      setIsSuspended(nextSuspended);
      if (!nextSuspended) setSuspendReason("");
      await mutate();
      showToast(nextSuspended ? "Compte utilisateur bloqué." : "Compte utilisateur débloqué.");
    } catch (e: any) {
      alert("Erreur lors de la modification du statut : " + e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Blocage rapide depuis la table
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

  // Vérification Créateur
  const handleUpdateVerification = async () => {
    if (!selectedUser) return;
    try {
      setIsUpdating(true);
      await adminApi(`/admin/users/${selectedUser.id}/creator-verification`, {
        method: "POST",
        body: JSON.stringify({ verified: !isVerified }),
      });
      setIsVerified(!isVerified);
      await mutate();
      showToast(!isVerified ? "Badge créateur vérifié attribué." : "Badge créateur vérifié retiré.");
    } catch (e: any) {
      alert("Erreur: " + e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Suppression définitive du compte
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
      showToast(`Le compte de ${userToDelete.fullName} (${userToDelete.email}) a été définitivement supprimé.`);
      
      // Si le panneau latéral affichait cet utilisateur, le fermer
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

  // Filtrage local actif / bloqué
  const rawItems = usersData?.items || [];
  const filteredUsers = rawItems.filter((u: any) => {
    if (statusFilter === "active") return !u.isSuspended;
    if (statusFilter === "suspended") return u.isSuspended;
    return true;
  });

  return (
    <div className="w-full pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161616] border border-[#2E2E2E] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle className="w-5 h-5 text-[#1DB954]" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1.5 flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-[#FFBF00]" />
            Utilisateurs & Comptes
          </h1>
          <p className="text-[#888888] text-sm">
            Gestion centralisée des accès, blocage de sécurité et suppression définitive de comptes.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher nom, email, ID..."
            className="w-full bg-[#111111] border border-[#242424] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white outline-none focus:border-[#444444] transition-colors placeholder:text-[#555555]"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setStatusFilter("all")}
          className={classNames(
            "px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors",
            statusFilter === "all"
              ? "bg-white text-black"
              : "bg-[#141414] text-[#888888] hover:text-white border border-[#242424]"
          )}
        >
          Tous les comptes ({rawItems.length})
        </button>
        <button
          onClick={() => setStatusFilter("active")}
          className={classNames(
            "px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5",
            statusFilter === "active"
              ? "bg-[#1DB954] text-black"
              : "bg-[#141414] text-[#888888] hover:text-white border border-[#242424]"
          )}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          Actifs ({rawItems.filter((u: any) => !u.isSuspended).length})
        </button>
        <button
          onClick={() => setStatusFilter("suspended")}
          className={classNames(
            "px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5",
            statusFilter === "suspended"
              ? "bg-[#EF4444] text-white"
              : "bg-[#141414] text-[#888888] hover:text-white border border-[#242424]"
          )}
        >
          <Ban className="w-3.5 h-3.5" />
          Bloqués ({rawItems.filter((u: any) => u.isSuspended).length})
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-[#111111] border border-[#222222] rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#222222] bg-[#0A0A0A]">
                <th className="px-6 py-4 text-xs font-semibold text-[#888888] uppercase tracking-wider">Utilisateur</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#888888] uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#888888] uppercase tracking-wider">Rôles</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#888888] uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#888888] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1F1F]">
              {isLoading && !usersData ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-[#888888]">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-[#FFBF00]" />
                    Chargement des comptes utilisateurs...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-[#888888]">
                    Aucun utilisateur trouvé pour cette sélection.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user: any) => {
                  const isCurrent = currentUser?.id === user.id;
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-[#161616] transition-colors group cursor-pointer"
                      onClick={() => openUserPanel(user)}
                    >
                      {/* Utilisateur */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover border border-[#2E2E2E]"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#2E2E2E] flex items-center justify-center font-bold text-white text-sm">
                              {user.fullName?.charAt(0).toUpperCase() || "?"}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-white flex items-center gap-1.5 text-sm">
                              {user.fullName || "Sans nom"}
                              {user.isVerified && <BadgeCheck className="w-4 h-4 text-blue-400 shrink-0" />}
                              {isCurrent && (
                                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#222222] text-[#AAAAAA] ml-1">
                                  Vous
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-[#666666] font-mono mt-0.5 truncate max-w-[180px]">
                              {user.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-200">{user.email}</div>
                        {user.phoneNumber && (
                          <div className="text-xs text-[#777777] mt-0.5 font-mono">{user.phoneNumber}</div>
                        )}
                      </td>

                      {/* Rôles */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {user.userRoles?.length > 0 ? (
                            user.userRoles.map((ur: any) => {
                              const roleName = ur.role?.name || ur.role;
                              const isSuper = roleName === "SUPER_ADMIN";
                              const isAdmin = roleName === "ADMIN";
                              const isCreator = roleName === "CREATOR";
                              return (
                                <span
                                  key={roleName}
                                  className={classNames(
                                    "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider",
                                    isSuper
                                      ? "bg-[#FFBF00] text-black"
                                      : isAdmin
                                      ? "bg-[#2563EB] text-white"
                                      : isCreator
                                      ? "bg-[#9333EA] text-white"
                                      : "bg-[#222222] text-gray-300"
                                  )}
                                >
                                  {roleName}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-xs text-[#555555]">Auditeur</span>
                          )}
                        </div>
                      </td>

                      {/* Statut */}
                      <td className="px-6 py-4">
                        {user.isSuspended ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#2E1417] text-[#EF4444] border border-red-900/40">
                            <Ban className="w-3.5 h-3.5" /> Bloqué
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#102A1A] text-[#1DB954] border border-emerald-900/40">
                            <CheckCircle className="w-3.5 h-3.5" /> Actif
                          </span>
                        )}
                      </td>

                      {/* Actions Rapides */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {/* Bouton Bloquer / Débloquer rapide */}
                          {!isCurrent ? (
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
                          ) : null}

                          {/* Bouton Supprimer rapide */}
                          {!isCurrent ? (
                            <button
                              title="Supprimer définitivement"
                              onClick={() => {
                                setUserToDelete(user);
                                setDeleteConfirmationInput("");
                                setDeleteError(null);
                              }}
                              className="p-2 rounded-lg bg-[#141414] hover:bg-[#2A1517] text-[#888888] hover:text-[#EF4444] border border-[#242424] hover:border-red-900/40 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : null}

                          {/* Bouton Ouvrir fiche */}
                          <button
                            onClick={() => openUserPanel(user)}
                            className="px-3 py-1.5 rounded-lg bg-[#1F1F1F] hover:bg-[#2A2A2A] text-white text-xs font-semibold transition-colors border border-[#2E2E2E]"
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
          <div className="p-4 border-t border-[#222222] flex items-center justify-between bg-[#0D0D0D]">
            <span className="text-xs text-[#888888]">
              Affichage {((page - 1) * limit) + 1} - {Math.min(page * limit, usersData.total)} sur {usersData.total}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="bg-[#161616] text-white hover:bg-[#222222] border border-[#262626]"
              >
                Précédent
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={page * limit >= usersData.total}
                onClick={() => setPage(page + 1)}
                className="bg-[#161616] text-white hover:bg-[#222222] border border-[#262626]"
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
            {/* Header */}
            <div className="p-6 border-b border-[#222222] flex items-center justify-between bg-[#0A0A0A]">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-[#FFBF00]" />
                <h2 className="text-lg font-bold text-white">Gestion de l'utilisateur</h2>
              </div>
              <button
                onClick={() => setIsPanelOpen(false)}
                className="text-[#888888] hover:text-white p-1 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-7">
              {/* Profil Card */}
              <div className="p-4 rounded-xl bg-[#161616] border border-[#262626]">
                <div className="flex items-start gap-4">
                  {selectedUser.avatar ? (
                    <img
                      src={selectedUser.avatar}
                      alt=""
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#333333] shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#222222] border-2 border-[#333333] flex items-center justify-center text-xl font-bold text-white shrink-0">
                      {selectedUser.fullName?.charAt(0).toUpperCase() || "?"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white truncate">{selectedUser.fullName || "Sans nom"}</h3>
                      {selectedUser.isVerified && <BadgeCheck className="w-4 h-4 text-blue-400 shrink-0" />}
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
              </div>

              {/* Statut en cours */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-[#888888] uppercase tracking-wider">État actuel du compte</h4>
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
                      <CheckCircle className="w-5 h-5 text-[#1DB954] shrink-0" />
                    )}
                    <div>
                      <div className="text-sm font-bold text-white">
                        {isSuspended ? "Compte Bloqué / Suspendu" : "Compte Actif"}
                      </div>
                      <div className="text-xs opacity-80 mt-0.5">
                        {isSuspended
                          ? (suspendReason ? `Motif: ${suspendReason}` : "Accès révoqué par l'administration")
                          : "L'utilisateur peut se connecter et interagir normalement."}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rôles RBAC */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-[#888888] uppercase tracking-wider">Rôles attribués</h4>
                <div className="flex flex-col gap-2">
                  {rolesData?.map((role: any) => (
                    <label
                      key={role.name}
                      className={classNames(
                        "flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer",
                        userRoles.includes(role.name)
                          ? "bg-[#191919] border-[#383838]"
                          : "bg-[#141414] border-[#222222] hover:bg-[#181818]"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={userRoles.includes(role.name)}
                        onChange={(e) => {
                          if (e.target.checked) setUserRoles([...userRoles, role.name]);
                          else setUserRoles(userRoles.filter((r) => r !== role.name));
                        }}
                        className="w-4 h-4 rounded bg-[#222222] border-[#444444] text-[#FFBF00] focus:ring-[#FFBF00]"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white">{role.name}</div>
                        {role.description && <div className="text-xs text-[#888888]">{role.description}</div>}
                      </div>
                    </label>
                  ))}
                  <Button
                    onClick={handleUpdateRoles}
                    disabled={isUpdating}
                    className="mt-1 bg-[#FFBF00] text-black hover:bg-[#E5AB00] font-bold text-xs"
                  >
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Enregistrer les rôles
                  </Button>
                </div>
              </div>

              {/* Badge Créateur */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-[#888888] uppercase tracking-wider">Certification Créateur</h4>
                <div className="p-4 rounded-xl border border-[#242424] bg-[#161616] flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-white flex items-center gap-2">
                      {isVerified ? (
                        <>
                          <BadgeCheck className="w-4 h-4 text-blue-400" /> Créateur Certifié
                        </>
                      ) : (
                        "Non certifié"
                      )}
                    </div>
                    <p className="text-xs text-[#888888] mt-0.5 pr-2">
                      Affiche le badge de confiance à côté de son nom sur le site et l'app.
                    </p>
                  </div>
                  <button
                    onClick={handleUpdateVerification}
                    disabled={isUpdating}
                    className={classNames(
                      "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      isVerified ? "bg-blue-500" : "bg-[#333333]"
                    )}
                  >
                    <span
                      className={classNames(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        isVerified ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>
              </div>

              {/* ZONE DE SÉCURITÉ : BLOCAGE & SUPPRESSION */}
              <div className="space-y-4 pt-2 border-t border-[#222222]">
                <h4 className="text-xs font-bold text-[#EF4444] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" /> Zone de Contrôle & Sécurité
                </h4>

                {/* 1. Blocage / Déblocage */}
                <div className="p-4 rounded-xl border border-[#2E2426] bg-[#161112]">
                  <div className="flex items-center gap-2.5 mb-2">
                    {isSuspended ? (
                      <Unlock className="w-4 h-4 text-[#1DB954]" />
                    ) : (
                      <Lock className="w-4 h-4 text-[#EF4444]" />
                    )}
                    <span className="text-sm font-bold text-white">
                      {isSuspended ? "Débloquer l'accès" : "Bloquer l'accès (Suspension)"}
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
                        placeholder="Raison personnalisée (ex: violation CGU)..."
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
                      "w-full text-xs font-bold transition-colors",
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
                      className="w-full bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold text-xs"
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

            {/* User Details */}
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

            {/* Confirmation Input */}
            <div className="space-y-1.5 mb-5">
              <label className="text-[11px] font-semibold text-[#888888] uppercase tracking-wider">
                Pour confirmer, saisissez l'adresse email :
              </label>
              <input
                type="text"
                placeholder={userToDelete.email}
                value={deleteConfirmationInput}
                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500 font-mono"
              />
            </div>

            {/* Modal Actions */}
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
    </div>
  );
}
