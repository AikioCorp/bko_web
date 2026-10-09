"use client";
import React, { useState } from "react";
import useSWR from "swr";
import { adminApi } from "@/lib/api";
import { Activity, Search, ShieldAlert, ArrowRight, Clock, Box, Eye, Code2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";

export default function AdminAuditPage() {
  const [filter, setFilter] = useState("");
  
  const fetcher = (url: string) => adminApi(url).then(res => res.data);
  const { data: logs, isLoading } = useSWR("/admin/audit", fetcher);

  const [selectedLog, setSelectedLog] = useState<any>(null);

  const filteredLogs = logs?.filter((log: any) => {
    if (!filter) return true;
    const term = filter.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      log.entityType.toLowerCase().includes(term) ||
      log.actor?.fullName?.toLowerCase().includes(term) ||
      log.actor?.email?.toLowerCase().includes(term)
    );
  });

  const getActionColor = (action: string) => {
    if (action.includes("CREATE") || action.includes("ADD")) return "text-green-500 bg-green-500/10";
    if (action.includes("DELETE") || action.includes("REMOVE") || action.includes("SUSPEND")) return "text-red-500 bg-red-500/10";
    if (action.includes("UPDATE") || action.includes("EDIT")) return "text-blue-500 bg-blue-500/10";
    return "text-[#888] bg-[#222]";
  };

  return (
    <div className="w-full pb-24">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
            <Activity className="w-6 h-6 text-[#FFBF00]" />
            Journal des actions
          </h1>
          <p className="text-[#888888]">Traçabilité complète des actions critiques effectuées sur la plateforme.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrer par action, acteur..."
            className="w-full bg-[#111] border border-[#222] rounded-lg pl-9 pr-4 py-2 text-sm text-white outline-none focus:border-[#444] transition-colors"
          />
        </div>
      </div>

      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#222] bg-[#0A0A0A]">
              <th className="px-6 py-4 text-xs font-semibold text-[#888] uppercase">Date & Heure</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#888] uppercase">Acteur</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#888] uppercase">Action</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#888] uppercase">Entité cible</th>
              <th className="px-6 py-4 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222]">
            {isLoading && !logs ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-[#888]">Chargement de l'audit...</td>
              </tr>
            ) : filteredLogs?.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-[#888]">Aucun log trouvé.</td>
              </tr>
            ) : (
              filteredLogs?.map((log: any) => (
                <tr key={log.id} className="hover:bg-[#161616] transition-colors group cursor-pointer" onClick={() => setSelectedLog(log)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-[#ccc]">
                      <Clock className="w-4 h-4 text-[#666]" />
                      {format(new Date(log.createdAt), "dd MMM yyyy, HH:mm:ss", { locale: fr })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {log.actor ? (
                      <div>
                        <div className="font-semibold text-white">{log.actor.fullName}</div>
                        <div className="text-xs text-[#888]">{log.actor.email}</div>
                      </div>
                    ) : (
                      <span className="text-[#888] italic">Système ou Inconnu</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Box className="w-4 h-4 text-[#888]" />
                      <div>
                        <div className="font-medium text-white">{log.entityType}</div>
                        <div className="text-xs text-[#888] font-mono mt-0.5">{log.entityId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[#888] hover:text-white p-2">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Slide-over Modal for Payload details */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setSelectedLog(null)} />
          <div className="relative bg-[#111] border border-[#222] w-full max-w-2xl rounded-2xl shadow-2xl p-6 flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <h2 className="text-xl font-bold text-white mb-2 border-b border-[#222] pb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#FFBF00]" />
              Détails de l'événement
            </h2>
            
            <div className="overflow-y-auto pr-2 pb-4 custom-scrollbar flex-1 space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-6 bg-[#0A0A0A] border border-[#222] p-4 rounded-xl">
                <div>
                  <div className="text-xs text-[#888] uppercase tracking-wider font-bold mb-1">ID de l'événement</div>
                  <div className="font-mono text-sm text-white">{selectedLog.id}</div>
                </div>
                <div>
                  <div className="text-xs text-[#888] uppercase tracking-wider font-bold mb-1">Horodatage</div>
                  <div className="text-sm text-white">{format(new Date(selectedLog.createdAt), "dd MMMM yyyy à HH:mm:ss", { locale: fr })}</div>
                </div>
                <div>
                  <div className="text-xs text-[#888] uppercase tracking-wider font-bold mb-1">Adresse IP</div>
                  <div className="font-mono text-sm text-white">{selectedLog.ipAddress || "Non enregistrée"}</div>
                </div>
                <div>
                  <div className="text-xs text-[#888] uppercase tracking-wider font-bold mb-1">Acteur</div>
                  <div className="text-sm text-white">{selectedLog.actor ? `${selectedLog.actor.fullName} (${selectedLog.actor.id})` : "Système"}</div>
                </div>
              </div>

              {(selectedLog.previousState || selectedLog.newState) ? (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-[#888]" /> Différentiel des données (Payload)
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedLog.previousState && (
                      <div className="bg-[#1A1A1A] border border-[#333] rounded-lg overflow-hidden">
                        <div className="bg-[#222] px-3 py-2 text-xs font-bold text-[#888] border-b border-[#333]">État précédent</div>
                        <pre className="p-3 text-xs text-[#ccc] font-mono overflow-x-auto">
                          {JSON.stringify(selectedLog.previousState, null, 2)}
                        </pre>
                      </div>
                    )}
                    {selectedLog.newState && (
                      <div className="bg-[#1A1A1A] border border-[#333] rounded-lg overflow-hidden">
                        <div className="bg-[#222] px-3 py-2 text-xs font-bold text-[#888] border-b border-[#333]">Nouvel état</div>
                        <pre className="p-3 text-xs text-[#ccc] font-mono overflow-x-auto">
                          {JSON.stringify(selectedLog.newState, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-[#0A0A0A] border border-[#222] rounded-xl text-[#888]">
                  Aucun payload (différentiel) enregistré pour cette action.
                </div>
              )}
            </div>
            
            <div className="pt-4 mt-auto text-right">
              <Button onClick={() => setSelectedLog(null)} variant="outline" className="bg-[#222] border-[#333] text-white hover:bg-[#333]">
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
