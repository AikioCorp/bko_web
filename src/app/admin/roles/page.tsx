"use client";

import React, { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import { useAccess } from "@/components/admin/access";
import { Badge, Btn, Card, ErrorBanner, Loading, PageHeader } from "@/components/admin/ui";

type Feature = { key: string; label: string; description: string; caps: string[] };
type Template = { key: string; name: string; description: string; permissions: string[] };
type Role = {
  id: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  isSuperAdmin: boolean;
  usersCount: number;
  permissions: string[];
};
type Catalog = { features: Feature[]; templates: Template[] };

const CAP_LABELS: Record<string, string> = { view: "Voir", create: "Créer", edit: "Modifier", delete: "Supprimer" };
const CAPS = ["view", "create", "edit", "delete"];

type Draft = { id?: string; name: string; description: string; permissions: string[] };

export default function RolesPage() {
  const { can, permissions: mine, isSuperAdmin } = useAccess();
  const [roles, setRoles] = useState<Role[] | null>(null);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const [r, c] = await Promise.all([adminApi<Role[]>("/admin/roles"), adminApi<Catalog>("/admin/permissions")]);
      setRoles(r);
      setCatalog(c);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // On ne peut accorder que les droits qu'on possède soi-même (le serveur applique la même règle).
  const grantable = (p: string) => isSuperAdmin || mine.includes(p);

  const toggle = (perm: string, on: boolean) => {
    if (!draft) return;
    setDraft({
      ...draft,
      permissions: on ? Array.from(new Set(draft.permissions.concat(perm))) : draft.permissions.filter((p) => p !== perm),
    });
  };
  const toggleRow = (f: Feature, on: boolean) => {
    if (!draft) return;
    const keys = f.caps.map((c) => `${f.key}.${c}`).filter(grantable);
    const rest = draft.permissions.filter((p) => !keys.includes(p));
    setDraft({ ...draft, permissions: on ? [...rest, ...keys] : rest });
  };

  const save = async () => {
    if (!draft) return;
    setBusy(true);
    setFormError("");
    try {
      if (draft.id) {
        await adminApi(`/admin/roles/${draft.id}`, {
          method: "PUT",
          body: { description: draft.description, permissions: draft.permissions },
        });
      } else {
        await adminApi(`/admin/roles`, {
          method: "POST",
          body: { name: draft.name, description: draft.description, permissions: draft.permissions },
        });
      }
      setDraft(null);
      await load();
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (r: Role) => {
    if (!window.confirm(`Supprimer le rôle « ${r.description || r.name} » ?`)) return;
    try {
      await adminApi(`/admin/roles/${r.id}`, { method: "DELETE" });
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Rôles & Permissions"
        subtitle="Créez des rôles sur mesure et choisissez, fonctionnalité par fonctionnalité, ce que chacun peut voir ou faire. Une page sans droit « Voir » disparaît du menu de la personne."
        actions={
          can("roles.create") ? (
            <Btn variant="primary" onClick={() => setDraft({ name: "", description: "", permissions: [] })}>
              Nouveau rôle
            </Btn>
          ) : undefined
        }
      />
      {error && <ErrorBanner message={error} onRetry={load} />}
      {!roles && !error && <Loading />}

      {roles && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {roles.map((r) => (
            <Card key={r.id} className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold">{r.description || r.name}</p>
                  <p className="text-[11px] font-mono text-gray-500">{r.name}</p>
                </div>
                <div className="flex gap-1">
                  {r.isSystem && <Badge>Système</Badge>}
                  {r.isSuperAdmin && <Badge tone="amber">Tous les droits</Badge>}
                </div>
              </div>
              <p className="text-xs text-gray-400">
                {r.usersCount} utilisateur(s) • {r.isSuperAdmin ? "accès total" : `${r.permissions.length} permission(s)`}
              </p>
              <div className="flex gap-2">
                {can("roles.edit") && !r.isSuperAdmin && (
                  <Btn
                    onClick={() => {
                      setFormError("");
                      setDraft({ id: r.id, name: r.name, description: r.description ?? "", permissions: r.permissions });
                    }}
                  >
                    Configurer
                  </Btn>
                )}
                {can("roles.delete") && !r.isSystem && (
                  <Btn variant="danger" disabled={r.usersCount > 0} title={r.usersCount ? "Rôle encore attribué" : ""} onClick={() => remove(r)}>
                    Supprimer
                  </Btn>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {draft && catalog && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-start justify-center p-4 overflow-y-auto" role="dialog" aria-modal="true">
          <Card className="w-full max-w-3xl p-6 space-y-5 my-8">
            <h2 className="text-lg font-bold">{draft.id ? `Configurer « ${draft.description || draft.name} »` : "Nouveau rôle"}</h2>

            {!draft.id && (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Partir d&apos;un modèle</p>
                <div className="flex flex-wrap gap-2">
                  {catalog.templates.map((t) => (
                    <Btn
                      key={t.key}
                      onClick={() =>
                        setDraft({ ...draft, name: t.name, description: t.description, permissions: t.permissions.filter(grantable) })
                      }
                    >
                      {t.description}
                    </Btn>
                  ))}
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              <label className="space-y-1 text-xs text-gray-400">
                Identifiant
                <input
                  value={draft.name}
                  disabled={!!draft.id}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="EX. MODERATEUR"
                  className="w-full bg-[#0B0B0B] border border-[#262626] rounded-lg p-2.5 text-sm text-white font-mono disabled:opacity-50"
                />
              </label>
              <label className="space-y-1 text-xs text-gray-400">
                Libellé affiché
                <input
                  value={draft.description}
                  maxLength={120}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="Modérateur"
                  className="w-full bg-[#0B0B0B] border border-[#262626] rounded-lg p-2.5 text-sm text-white"
                />
              </label>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400 border-b border-[#262626]">
                    <th className="py-2 pr-4">Fonctionnalité</th>
                    {CAPS.map((c) => (
                      <th key={c} className="py-2 px-2 text-center">
                        {CAP_LABELS[c]}
                      </th>
                    ))}
                    <th className="py-2 pl-2 text-center">Tout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262626]">
                  {catalog.features.map((f) => {
                    const keys = f.caps.map((c) => `${f.key}.${c}`);
                    const all = keys.every((k) => draft.permissions.includes(k));
                    return (
                      <tr key={f.key}>
                        <td className="py-3 pr-4">
                          <p className="font-semibold">{f.label}</p>
                          <p className="text-[11px] text-gray-500">{f.description}</p>
                        </td>
                        {CAPS.map((c) => {
                          const perm = `${f.key}.${c}`;
                          return (
                            <td key={c} className="text-center px-2">
                              {f.caps.includes(c) ? (
                                <input
                                  type="checkbox"
                                  aria-label={`${f.label} : ${CAP_LABELS[c]}`}
                                  checked={draft.permissions.includes(perm)}
                                  disabled={!grantable(perm)}
                                  onChange={(e) => toggle(perm, e.target.checked)}
                                  className="accent-[#FFBF00] w-4 h-4"
                                />
                              ) : (
                                <span className="text-gray-700">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="text-center pl-2">
                          <input
                            type="checkbox"
                            aria-label={`${f.label} : tout`}
                            checked={all}
                            disabled={!keys.some(grantable)}
                            onChange={(e) => toggleRow(f, e.target.checked)}
                            className="accent-[#FFBF00] w-4 h-4"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500">
              Les cases grisées sont des droits que vous ne possédez pas : vous ne pouvez pas les accorder. Les modifications s&apos;appliquent en quelques secondes.
            </p>

            {formError && <p className="text-sm text-red-400">{formError}</p>}
            <div className="flex justify-end gap-2">
              <Btn onClick={() => setDraft(null)} disabled={busy}>
                Annuler
              </Btn>
              <Btn variant="primary" onClick={save} disabled={busy || (!draft.id && draft.name.trim().length < 3)}>
                {busy ? "…" : "Enregistrer"}
              </Btn>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
