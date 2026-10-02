"use client";

import React, { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import { Badge, Btn, Card, Empty, ErrorBanner, Loading, PageHeader, ReasonDialog } from "@/components/admin/ui";
import { useAuthStore } from "@/store/authStore";
import { useAccess } from "@/components/admin/access";

type U = {
  id: string;
  email: string;
  fullName: string;
  isVerified: boolean;
  isSuspended: boolean;
  suspendedReason?: string | null;
  createdAt: string;
  roles: string[];
  creatorProfile?: { slug: string; isVerified: boolean } | null;
};
type Page = { items: U[]; total: number; page: number; limit: number };
type Role = { id: string; name: string; description?: string | null };

export default function UsersPage() {
  const me = useAuthStore((s) => s.user);
  const canEdit = useAccess().can("users.edit");

  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState("");
  const [suspend, setSuspend] = useState<U | null>(null);
  const [editing, setEditing] = useState<U | null>(null);
  const [draft, setDraft] = useState<string[]>([]);
  const [rolesError, setRolesError] = useState("");

  useEffect(() => {
    adminApi<Role[]>("/admin/assignable-roles").then(setRoles).catch(() => {});
  }, []);

  // Recherche différée pour ne pas solliciter l'API à chaque frappe.
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setError("");
    try {
      const qs = new URLSearchParams({ page: String(page), limit: "20" });
      if (query) qs.set("search", query);
      if (role) qs.set("role", role);
      setData(await adminApi<Page>(`/admin/users?${qs}`));
    } catch (e: any) {
      setError(e.message);
    }
  }, [query, role, page]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleTrusted = async (u: U) => {
    try {
      await adminApi(`/admin/users/${u.id}/creator-verification`, {
        method: "POST",
        body: { verified: !u.creatorProfile?.isVerified },
      });
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };
  const doSuspend = async (reason: string) => {
    if (!suspend) return;
    await adminApi(`/admin/users/${suspend.id}/suspension`, { method: "POST", body: { suspended: true, reason } });
    setSuspend(null);
    await load();
  };
  const reactivate = async (u: U) => {
    try {
      await adminApi(`/admin/users/${u.id}/suspension`, { method: "POST", body: { suspended: false } });
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };
  const saveRoles = async () => {
    if (!editing) return;
    setRolesError("");
    try {
      await adminApi(`/admin/users/${editing.id}/roles`, { method: "PUT", body: { roles: draft } });
      setEditing(null);
      await load();
    } catch (e: any) {
      setRolesError(e.message);
    }
  };

  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <>
      <PageHeader title="Créateurs & Utilisateurs" subtitle="Recherchez un compte, ajustez ses rôles ou suspendez-le. Chaque action est journalisée." />

      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom, email ou téléphone…"
          className="flex-1 min-w-[240px] bg-[#161616] border border-[#262626] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFBF00]"
        />
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          className="bg-[#161616] border border-[#262626] rounded-xl px-3 text-sm text-white"
          aria-label="Filtrer par rôle"
        >
          <option value="">Tous les rôles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.name}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}
      {!data && !error && <Loading />}

      {data && (
        <Card className="overflow-x-auto">
          {data.items.length === 0 ? (
            <Empty>Aucun utilisateur trouvé.</Empty>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400 border-b border-[#262626]">
                  <th className="p-4">Utilisateur</th>
                  <th className="p-4">Rôles</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {data.items.map((u) => {
                  const self = u.id === me?.id;
                  return (
                    <tr key={u.id}>
                      <td className="p-4">
                        <p className="font-bold">{u.fullName}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map((r) => (
                            <Badge key={r} tone={r.toUpperCase() === "SUPER_ADMIN" ? "amber" : "gray"}>
                              {r}
                            </Badge>
                          ))}
                          {u.creatorProfile?.isVerified && <Badge tone="green">Créateur de confiance</Badge>}
                        </div>
                      </td>
                      <td className="p-4">
                        {u.isSuspended ? (
                          <span title={u.suspendedReason ?? ""}>
                            <Badge tone="red">Suspendu</Badge>
                          </span>
                        ) : u.isVerified ? (
                          <Badge tone="green">Vérifié</Badge>
                        ) : (
                          <Badge>Non vérifié</Badge>
                        )}
                      </td>
                      <td className="p-4">
                        {canEdit && (<div className="flex justify-end gap-2">
                          {u.creatorProfile && (
                            <Btn onClick={() => toggleTrusted(u)} title="Un créateur de confiance publie sans validation préalable">
                              {u.creatorProfile.isVerified ? "Retirer la confiance" : "Marquer de confiance"}
                            </Btn>
                          )}
                          <Btn
                            disabled={self}
                            onClick={() => {
                              setEditing(u);
                              setDraft(u.roles);
                              setRolesError("");
                            }}
                          >
                            Rôles
                          </Btn>
                          {u.isSuspended ? (
                            <Btn onClick={() => reactivate(u)}>
                              Réactiver
                            </Btn>
                          ) : (
                            <Btn variant="danger" disabled={self} onClick={() => setSuspend(u)}>
                              Suspendre
                            </Btn>
                          )}
                        </div>)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 text-xs">
          <Btn disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Précédent
          </Btn>
          <span className="text-gray-400">
            Page {page} / {pages} • {data?.total} comptes
          </span>
          <Btn disabled={page >= pages} onClick={() => setPage(page + 1)}>
            Suivant
          </Btn>
        </div>
      )}

      {suspend && (
        <ReasonDialog
          title={`Suspendre ${suspend.fullName} ?`}
          description="Toutes ses sessions seront coupées et il ne pourra plus se connecter."
          confirmLabel="Suspendre"
          danger
          onConfirm={doSuspend}
          onCancel={() => setSuspend(null)}
        />
      )}

      {editing && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <Card className="w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold">Rôles de {editing.fullName}</h2>
            <div className="space-y-2">
              {roles.map((r) => (
                  <label key={r.id} className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={draft.some((d) => d.toUpperCase() === r.name.toUpperCase())}
                      onChange={(e) =>
                        setDraft(e.target.checked ? [...draft, r.name] : draft.filter((d) => d.toUpperCase() !== r.name.toUpperCase()))
                      }
                      className="accent-[#FFBF00]"
                    />
                    {r.description && r.description !== r.name ? `${r.description} (${r.name})` : r.name}
                  </label>
                ))}
            </div>
            <p className="text-xs text-gray-500">Les sessions de l'utilisateur seront réinitialisées pour appliquer le changement.</p>
            {rolesError && <p className="text-xs text-red-400">{rolesError}</p>}
            <div className="flex justify-end gap-2">
              <Btn onClick={() => setEditing(null)}>Annuler</Btn>
              <Btn variant="primary" onClick={saveRoles} disabled={draft.length === 0}>
                Enregistrer
              </Btn>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
