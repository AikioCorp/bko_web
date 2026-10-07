"use client";
import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { adminApi } from "@/lib/api";
import { Search, ShieldAlert, CheckCircle, XCircle, MoreVertical, Shield, Ban, BadgeCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const fetcher = (url: string) => adminApi(url).then((res) => res.data);
  const { data: usersData, mutate, isLoading } = useSWR(`/admin/users?page=${page}&limit=${limit}${debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ""}`, fetcher);
  const { data: rolesData } = useSWR("/admin/assignable-roles", fetcher);

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [suspendReason, setSuspendReason] = useState("");
  const [isSuspended, setIsSuspended] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const openUserPanel = (user: any) => {
    setSelectedUser(user);
    setUserRoles(user.userRoles?.map((ur: any) => ur.role.name) || []);
    setIsSuspended(user.isSuspended);
    setSuspendReason(user.suspendedReason || "");
    setIsVerified(user.isVerified);
    setIsPanelOpen(true);
  };

  const handleUpdateRoles = async () => {
    if (!selectedUser) return;
    try {
      setIsUpdating(true);
      await adminApi(`/admin/users/${selectedUser.id}/roles`, {
        method: "PUT",
        body: JSON.stringify({ roles: userRoles })
      });
      await mutate();
      alert("Rôles mis à jour");
    } catch (e: any) {
      alert("Erreur: " + e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateSuspension = async () => {
    if (!selectedUser) return;
    try {
      setIsUpdating(true);
      await adminApi(`/admin/users/${selectedUser.id}/suspension`, {
        method: "POST",
        body: JSON.stringify({ suspended: !isSuspended, reason: !isSuspended ? suspendReason : undefined })
      });
      setIsSuspended(!isSuspended);
      await mutate();
    } catch (e: any) {
      alert("Erreur: " + e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateVerification = async () => {
    if (!selectedUser) return;
    try {
      setIsUpdating(true);
      await adminApi(`/admin/users/${selectedUser.id}/creator-verification`, {
        method: "POST",
        body: JSON.stringify({ verified: !isVerified })
      });
      setIsVerified(!isVerified);
      await mutate();
    } catch (e: any) {
      alert("Erreur: " + e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Utilisateurs</h1>
          <p className="text-[#888888]">Gérez les comptes, rôles et accès des membres.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher nom, email..."
            className="w-full bg-[#111] border border-[#222] rounded-lg pl-9 pr-4 py-2 text-sm text-white outline-none focus:border-[#444] transition-colors"
          />
        </div>
      </div>

      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#222] bg-[#0A0A0A]">
              <th className="px-6 py-4 text-xs font-semibold text-[#888] uppercase">Utilisateur</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#888] uppercase">Contact</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#888] uppercase">Rôles</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#888] uppercase">Statut</th>
              <th className="px-6 py-4 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222]">
            {isLoading && !usersData ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-[#888]">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#444]" />
                  Chargement des utilisateurs...
                </td>
              </tr>
            ) : usersData?.items?.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-[#888]">
                  Aucun utilisateur trouvé.
                </td>
              </tr>
            ) : (
              usersData?.items?.map((user: any) => (
                <tr key={user.id} className="hover:bg-[#161616] transition-colors group cursor-pointer" onClick={() => openUserPanel(user)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <img src={user.avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-[#333]" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#222] border border-[#333] flex items-center justify-center font-bold text-[#888]">
                          {user.fullName?.charAt(0).toUpperCase() || "?"}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          {user.fullName || "Sans nom"}
                          {user.isVerified && <BadgeCheck className="w-4 h-4 text-blue-500" />}
                        </div>
                        <div className="text-xs text-[#888] font-mono mt-0.5">{user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-white">{user.email}</div>
                    {user.phoneNumber && <div className="text-xs text-[#888] mt-0.5">{user.phoneNumber}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {user.userRoles?.length > 0 ? (
                        user.userRoles.map((ur: any) => (
                          <span key={ur.role.name} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#222] text-gray-300 uppercase tracking-wider">
                            {ur.role.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-[#666]">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.isSuspended ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-500/10 text-red-500">
                        <Ban className="w-3.5 h-3.5" /> Suspendu
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-green-500/10 text-green-500">
                        <CheckCircle className="w-3.5 h-3.5" /> Actif
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[#888] hover:text-white p-2" onClick={(e) => { e.stopPropagation(); openUserPanel(user); }}>
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Pagination Simple */}
        {usersData && usersData.total > limit && (
          <div className="p-4 border-t border-[#222] flex items-center justify-between">
            <span className="text-xs text-[#888]">
              Affichage {((page - 1) * limit) + 1} - {Math.min(page * limit, usersData.total)} sur {usersData.total}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>
                Précédent
              </Button>
              <Button size="sm" variant="ghost" disabled={page * limit >= usersData.total} onClick={() => setPage(page + 1)}>
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* User Slide-over Panel */}
      {isPanelOpen && selectedUser && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 transition-opacity" onClick={() => setIsPanelOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#111] border-l border-[#222] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-6 border-b border-[#222] flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#FFBF00]" />
                Gestion Utilisateur
              </h2>
              <button onClick={() => setIsPanelOpen(false)} className="text-[#888] hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Infos */}
              <div className="flex items-center gap-4">
                {selectedUser.avatar ? (
                  <img src={selectedUser.avatar} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-[#333]" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#222] border-2 border-[#333] flex items-center justify-center text-xl font-bold text-[#888]">
                    {selectedUser.fullName?.charAt(0).toUpperCase() || "?"}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-white leading-tight">{selectedUser.fullName}</h3>
                  <p className="text-sm text-[#888]">{selectedUser.email}</p>
                </div>
              </div>

              {/* Roles */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-white uppercase tracking-wide border-b border-[#222] pb-2">Rôles</h4>
                <div className="flex flex-col gap-2">
                  {rolesData?.map((role: any) => (
                    <label key={role.name} className="flex items-center gap-3 p-3 rounded-lg border border-[#222] hover:bg-[#161616] cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={userRoles.includes(role.name)}
                        onChange={(e) => {
                          if (e.target.checked) setUserRoles([...userRoles, role.name]);
                          else setUserRoles(userRoles.filter(r => r !== role.name));
                        }}
                        className="w-4 h-4 rounded bg-[#222] border-[#444] text-[#FFBF00] focus:ring-[#FFBF00] focus:ring-offset-[#111]"
                      />
                      <div>
                        <div className="text-sm font-medium text-white">{role.name}</div>
                        {role.description && <div className="text-xs text-[#888]">{role.description}</div>}
                      </div>
                    </label>
                  ))}
                  <Button onClick={handleUpdateRoles} disabled={isUpdating} className="mt-2 bg-[#FFBF00] text-black hover:bg-[#E5AB00]">
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Mettre à jour les rôles
                  </Button>
                </div>
              </div>

              {/* Creator Status */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-white uppercase tracking-wide border-b border-[#222] pb-2">Vérification Créateur</h4>
                <div className="p-4 rounded-lg border border-[#222] bg-[#161616]">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-medium text-white flex items-center gap-2">
                        {isVerified ? (
                          <><BadgeCheck className="w-4 h-4 text-blue-500" /> Créateur Vérifié</>
                        ) : (
                          "Non vérifié"
                        )}
                      </div>
                      <p className="text-xs text-[#888] mt-1 pr-4">Le badge vérifié s'affiche publiquement à côté de son nom.</p>
                    </div>
                    <button
                      onClick={handleUpdateVerification}
                      disabled={isUpdating}
                      className={classNames(
                        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                        isVerified ? "bg-blue-500" : "bg-[#333]"
                      )}
                    >
                      <span className={classNames("pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out", isVerified ? "translate-x-5" : "translate-x-0")} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Suspension */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-white uppercase tracking-wide border-b border-[#222] pb-2 text-red-500">Zone de danger</h4>
                <div className="p-4 rounded-lg border border-red-900/50 bg-red-950/10">
                  <div className="flex items-center gap-3 mb-4">
                    <ShieldAlert className="w-5 h-5 text-red-500" />
                    <div className="text-sm font-medium text-white">Suspension du compte</div>
                  </div>
                  {!isSuspended && (
                    <input
                      type="text"
                      placeholder="Raison de la suspension (optionnelle)"
                      value={suspendReason}
                      onChange={e => setSuspendReason(e.target.value)}
                      className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-red-500 mb-3"
                    />
                  )}
                  <Button 
                    variant="ghost" 
                    onClick={handleUpdateSuspension}
                    disabled={isUpdating}
                    className={classNames(
                      "w-full font-bold", 
                      isSuspended ? "bg-[#222] text-white hover:bg-[#333]" : "bg-red-500/20 text-red-500 hover:bg-red-500/30 hover:text-red-400"
                    )}
                  >
                    {isSuspended ? "Lever la suspension" : "Suspendre l'utilisateur"}
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </>
      )}

    </div>
  );
}
