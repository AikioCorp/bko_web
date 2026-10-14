"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Trash2, CheckCheck } from "lucide-react";
import { studioApi, timeAgo } from "@/lib/studioApi";
import { useAuthStore } from "@/store/authStore";

type Notif = {
  id: string;
  type?: string;
  title: string;
  body?: string | null;
  link?: string | null;
  readAt?: string | null;
  createdAt: string;
};

function isSafeLink(link?: string | null): boolean {
  if (!link) return false;
  const trimmed = link.trim();
  return trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.startsWith("/\\");
}

export default function NotificationsPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.isLoading);

  const [items, setItems] = useState<Notif[] | null>(null);
  const [unread, setUnread] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Évite les requêtes concurrentes de pagination
  const inFlightRef = useRef(false);

  // Nettoyage complet au changement de compte ou à la déconnexion
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setItems(null);
      setUnread(0);
      setHasMore(false);
      setError(null);
      setActionNotice(null);
    }
  }, [isAuthenticated, user?.id]);

  const load = useCallback(
    async (before?: string) => {
      if (!isAuthenticated || inFlightRef.current) return;
      inFlightRef.current = true;

      if (before) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      try {
        const query = before ? `?limit=30&before=${encodeURIComponent(before)}` : "?limit=30";
        const r = await studioApi<{ items: Notif[]; unread: number }>(`/me/notifications${query}`);

        setItems((cur) => {
          if (!before || !cur) return r.items;
          const existingIds = new Set(cur.map((i) => i.id));
          const fresh = r.items.filter((i) => !existingIds.has(i.id));
          return [...cur, ...fresh];
        });

        setUnread(r.unread ?? 0);
        setHasMore(r.items.length === 30);
        setError(null);
      } catch (e: any) {
        setError(e.message || "Impossible de charger les notifications.");
      } finally {
        inFlightRef.current = false;
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [isAuthenticated]
  );

  useEffect(() => {
    if (isAuthenticated) {
      load();
    }
  }, [isAuthenticated, load]);

  const markAll = async () => {
    const previousItems = items;
    const previousUnread = unread;

    // Mise à jour optimiste
    setItems((l) => l?.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })) ?? null);
    setUnread(0);

    try {
      await studioApi("/me/notifications/read", { method: "POST", body: {} });
      setActionNotice("Toutes les notifications ont été marquées comme lues.");
      setTimeout(() => setActionNotice(null), 3000);
    } catch (e: any) {
      // Annulation en cas d'erreur serveur
      setItems(previousItems);
      setUnread(previousUnread);
      setActionNotice("Échec du marquage global. Veuillez réessayer.");
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const markOne = async (id: string) => {
    const previousItems = items;
    const previousUnread = unread;

    // Mise à jour optimiste
    setItems((l) => l?.map((n) => (n.id === id ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n)) ?? null);
    setUnread((c) => Math.max(0, c - 1));

    try {
      await studioApi("/me/notifications/read", { method: "POST", body: { ids: [id] } });
    } catch (e: any) {
      // Annulation en cas d'erreur serveur
      setItems(previousItems);
      setUnread(previousUnread);
    }
  };

  const deleteOne = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    const previousItems = items;
    const previousUnread = unread;
    const notif = items?.find((n) => n.id === id);
    const wasUnread = notif && !notif.readAt;

    // Mise à jour optimiste
    setItems((l) => l?.filter((n) => n.id !== id) ?? null);
    if (wasUnread) {
      setUnread((c) => Math.max(0, c - 1));
    }

    try {
      await studioApi(`/me/notifications/${id}`, { method: "DELETE" });
      setActionNotice("Notification supprimée.");
      setTimeout(() => setActionNotice(null), 3000);
    } catch (e: any) {
      setItems(previousItems);
      setUnread(previousUnread);
      setActionNotice("Échec de la suppression.");
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  const clearAll = async () => {
    if (!items || items.length === 0) return;
    if (!window.confirm("Voulez-vous vraiment effacer toutes vos notifications ?")) return;

    const previousItems = items;
    const previousUnread = unread;

    // Mise à jour optimiste
    setItems([]);
    setUnread(0);

    try {
      await studioApi("/me/notifications", { method: "DELETE" });
      setActionNotice("Toutes les notifications ont été effacées.");
      setTimeout(() => setActionNotice(null), 3000);
    } catch (e: any) {
      setItems(previousItems);
      setUnread(previousUnread);
      setActionNotice("Échec de l'effacement des notifications.");
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  if (authLoading) {
    return <div className="p-20 text-center text-sm text-gray-500">Chargement de votre session…</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-3">
        <p className="text-sm text-gray-400">Connectez-vous pour voir vos notifications.</p>
        <Link
          href="/login?redirect=/notifications"
          className="inline-block bg-[#FFBF00] text-[#0B0B0B] text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#E5AC00] transition"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold text-white">Notifications</h1>
          {loading && items && items.length > 0 && (
            <span className="text-xs text-gray-400 animate-pulse">Actualisation…</span>
          )}
        </div>
        {items && items.length > 0 && (
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <button
                onClick={markAll}
                className="text-xs bg-[#FFBF00]/10 hover:bg-[#FFBF00]/20 text-[#FFBF00] border border-[#FFBF00]/30 font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Tout lire ({unread})
              </button>
            )}
            <button
              onClick={clearAll}
              className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Tout effacer
            </button>
          </div>
        )}
      </div>

      {actionNotice && (
        <div className="p-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-xs text-white">
          {actionNotice}
        </div>
      )}

      {error && (
        <div className="p-4 bg-[#1E1212] border border-[#3E1B1B] rounded-xl text-xs text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => load()}
            className="ml-3 px-3 py-1 bg-[#3E1B1B] hover:bg-[#5E2B2B] text-white rounded-lg font-bold"
          >
            Réessayer
          </button>
        </div>
      )}

      {!items && loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-[#161616] border border-[#262626] rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {items && items.length === 0 && !error && (
        <div className="bg-[#161616] border border-[#262626] rounded-2xl p-10 text-center space-y-2">
          <p className="text-sm font-bold text-white">Aucune notification pour le moment</p>
          <p className="text-xs text-gray-400">
            Vous recevrez ici les nouveaux épisodes de vos podcasts favoris et les actualités.
          </p>
        </div>
      )}

      {items && items.length > 0 && (
        <ul className="border border-[#262626] rounded-2xl overflow-hidden divide-y divide-[#1C1C1C]">
          {items.map((n) => {
            const hasSafeLink = isSafeLink(n.link);
            const inner = (
              <div className={`px-4 py-3.5 flex items-center justify-between gap-3 group transition ${n.readAt ? "bg-[#121212]" : "bg-[#FFBF00]/5"}`}>
                <div className="flex gap-3 min-w-0 flex-1 items-start">
                  <span
                    className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${n.readAt ? "bg-transparent" : "bg-[#FFBF00]"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-white truncate">{n.title}</p>
                      <span className="text-[11px] text-[#757575] shrink-0">{timeAgo(n.createdAt)}</span>
                    </div>
                    {n.body && <p className="text-xs text-[#B8B8B8] mt-0.5 line-clamp-2">{n.body}</p>}
                  </div>
                </div>
                <button
                  onClick={(e) => deleteOne(e, n.id)}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-gray-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition shrink-0 ml-1"
                  title="Supprimer cette notification"
                  aria-label="Supprimer cette notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );

            return (
              <li key={n.id}>
                {hasSafeLink ? (
                  <Link
                    href={n.link!}
                    onClick={() => !n.readAt && markOne(n.id)}
                    className="block hover:bg-[#1A1A1A] transition"
                  >
                    {inner}
                  </Link>
                ) : (
                  <button
                    onClick={() => !n.readAt && markOne(n.id)}
                    className="block w-full text-left hover:bg-[#1A1A1A] transition"
                  >
                    {inner}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {hasMore && items && (
        <div className="pt-2 text-center">
          <button
            onClick={() => items.length > 0 && load(items[items.length - 1].createdAt)}
            disabled={loadingMore}
            className="bg-[#262626] hover:bg-[#333333] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition disabled:opacity-50"
          >
            {loadingMore ? "Chargement des suivantes…" : "Voir plus de notifications"}
          </button>
        </div>
      )}
    </div>
  );
}
