"use client";
import React, { useState } from "react";
import useSWR from "swr";
import { adminApi } from "@/lib/api";
import { Shield, Plus, Edit2, Trash2, Users, Check, X, ShieldAlert, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminRolesPage() {
  const fetcher = (url: string) => adminApi(url).then(res => res.data);
  const { data: roles, mutate, isLoading: isLoadingRoles } = useSWR("/admin/roles", fetcher);
  const { data: permissionsCatalog, isLoading: isLoadingPerms } = useSWR("/admin/permissions", fetcher);

  const [isEditing, setIsEditing] = useState<any>(null);
  const [formData, setFormData] = useState<{name: string, description: string, permissions: string[]}>({ name: "", description: "", permissions: [] });
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenEdit = (role?: any) => {
    if (role) {
      setIsEditing(role);
      setFormData({ name: role.name, description: role.description || "", permissions: role.permissions || [] });
    } else {
      setIsEditing({ isNew: true });
      setFormData({ name: "", description: "", permissions: [] });
    }
  };

  const togglePermission = (code: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(code)
        ? prev.permissions.filter(p => p !== code)
        : [...prev.permissions, code]
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      if (isEditing.isNew) {
        await adminApi("/admin/roles", { method: "POST", body: JSON.stringify(formData) });
      } else {
        await adminApi(`/admin/roles/${isEditing.id}`, { method: "PUT", body: JSON.stringify(formData) });
      }
      await mutate();
      setIsEditing(null);
    } catch (err: any) {
      alert("Erreur: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Voulez-vous vraiment supprimer le rÃƒÆ’Ã‚Â´le "${name}" ?`)) return;
    try {
      await adminApi(`/admin/roles/${id}`, { method: "DELETE" });
      await mutate();
    } catch (err: any) {
      alert("Erreur: " + err.message);
    }
  };

  const isLoading = isLoadingRoles || isLoadingPerms;

  return (
    <div className="w-full pb-32">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
            <Shield className="w-6 h-6 text-[#FFBF00]" />
            Administrateurs et rÃƒÆ’Ã‚Â´les
          </h1>
          <p className="text-[#888888]">GÃƒÆ’Ã‚Â©rez les niveaux d'accÃƒÆ’Ã‚Â¨s et les permissions de vos ÃƒÆ’Ã‚Â©quipes.</p>
        </div>
        <Button onClick={() => handleOpenEdit()} className="bg-[#FFBF00] text-black font-bold hover:bg-[#E5AB00]">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau RÃƒÆ’Ã‚Â´le
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isLoading && !roles ? (
          <div className="lg:col-span-3 text-center p-12 text-[#888]">Chargement...</div>
        ) : (
          roles?.map((role: any) => (
            <div key={role.id} className="bg-[#111] border border-[#222] rounded-2xl p-6 flex flex-col h-full relative group transition-colors hover:border-[#333]">
              {role.isSystem && (
                <div className="absolute -top-3 left-6 bg-[#222] text-[#888] text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1 border border-[#333]">
                  RÃƒÆ’Ã‚Â´le SystÃƒÆ’Ã‚Â¨me
                </div>
              )}
              
              <div className="flex justify-between items-start mb-4 mt-2">
                <h3 className="text-xl font-bold text-white">{role.name}</h3>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!role.isSystem && (
                    <>
                      <button onClick={() => handleOpenEdit(role)} className="p-1.5 text-[#888] hover:text-white bg-[#222] rounded-lg">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(role.id, role.name)} className="p-1.5 text-red-500 hover:text-red-400 bg-red-950/20 rounded-lg">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  {role.isSystem && (
                    <button onClick={() => handleOpenEdit(role)} className="p-1.5 text-[#888] hover:text-white bg-[#222] rounded-lg">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-sm text-[#888] mb-6 flex-1 line-clamp-3">
                {role.description || "Aucune description fournie pour ce rÃƒÆ’Ã‚Â´le."}
              </p>
              
              <div className="border-t border-[#222] pt-4 flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {role.isSuperAdmin ? (
                    <span className="text-xs font-semibold px-2.5 py-1 bg-[#FFBF00]/10 text-[#FFBF00] rounded flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> Tous les droits
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-2.5 py-1 bg-[#222] text-[#888] rounded">
                      {role.permissions?.length || 0} permission(s)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#666]">
                  <Users className="w-3.5 h-3.5" /> {role.usersCount || 0}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Editor Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setIsEditing(null)} />
          <div className="relative bg-[#111] border border-[#222] w-full max-w-3xl rounded-2xl shadow-2xl p-6 flex flex-col h-[90vh] animate-in zoom-in-95">
            <h2 className="text-xl font-bold text-white mb-2 border-b border-[#222] pb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#FFBF00]" />
              {isEditing.isNew ? "CrÃƒÆ’Ã‚Â©er un RÃƒÆ’Ã‚Â´le" : isEditing.isSystem ? "Voir le RÃƒÆ’Ã‚Â´le (Lecture seule)" : "Modifier le RÃƒÆ’Ã‚Â´le"}
            </h2>
            
            <form id="roleForm" onSubmit={handleSave} className="overflow-y-auto pr-4 custom-scrollbar flex-1 space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#888] uppercase mb-2">Nom du rÃƒÆ’Ã‚Â´le</label>
                  <input
                    required
                    disabled={isEditing.isSystem}
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg p-3 text-sm text-white outline-none focus:border-[#FFBF00] disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#888] uppercase mb-2">Description</label>
                  <input
                    disabled={isEditing.isSystem}
                    type="text"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg p-3 text-sm text-white outline-none focus:border-[#FFBF00] disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#888] uppercase mb-4">Permissions attribuÃƒÆ’Ã‚Â©es</label>
                
                {isEditing.isSuperAdmin ? (
                  <div className="bg-[#FFBF00]/10 border border-[#FFBF00]/30 rounded-lg p-6 text-center">
                    <ShieldAlert className="w-8 h-8 text-[#FFBF00] mx-auto mb-3" />
                    <h4 className="text-[#FFBF00] font-bold">Super Administrateur</h4>
                    <p className="text-sm text-[#FFBF00]/70 mt-1">Ce rÃƒÆ’Ã‚Â´le possÃƒÆ’Ã‚Â¨de implicitement toutes les permissions du systÃƒÆ’Ã‚Â¨me. Elles ne peuvent ÃƒÆ’Ã‚Âªtre restreintes.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {permissionsCatalog?.features?.map((group: any) => (
                      <div key={group.key} className="bg-[#0A0A0A] border border-[#222] rounded-xl overflow-hidden">
                        <div className="bg-[#161616] px-4 py-3 border-b border-[#222] flex flex-col">
                          <h4 className="text-sm font-bold text-white">{group.label}</h4>
                          <span className="text-xs text-[#888]">{group.description}</span>
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          {group.caps.map((cap: any) => {
                            const code = `${group.key}.${cap}`;
                            const isChecked = formData.permissions.includes(code);
                            return (
                              <label key={code} className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${isChecked ? 'border-[#FFBF00]/50 bg-[#FFBF00]/5' : 'border-[#222] hover:bg-[#161616]'} ${isEditing.isSystem ? 'pointer-events-none opacity-80' : ''}`}>
                                <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${isChecked ? 'bg-[#FFBF00] text-black' : 'bg-[#222] border border-[#444] text-transparent'}`}>
                                  <Check className="w-3 h-3" />
                                </div>
                                <input
                                  type="checkbox"
                                  className="hidden"
                                  checked={isChecked}
                                  onChange={() => togglePermission(code)}
                                  disabled={isEditing.isSystem}
                                />
                                <span className="text-sm font-medium text-white uppercase">{cap}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </form>
            
            <div className="pt-6 border-t border-[#222] flex items-center justify-end gap-3 mt-auto shrink-0">
              <Button type="button" variant="ghost" onClick={() => setIsEditing(null)} className="text-[#888] hover:text-white">
                Fermer
              </Button>
              {!isEditing.isSystem && (
                <Button form="roleForm" type="submit" disabled={isSaving} className="bg-[#FFBF00] text-black hover:bg-[#E5AB00] font-bold">
                  {isSaving ? "Enregistrement..." : "Enregistrer"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

