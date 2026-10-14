"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Trash2 } from "lucide-react";
import { studioApi, timeAgo } from "@/lib/studioApi";
import { useAuthStore } from "@/store/authStore";

type Notif = { id: string; type: string; title: string; body?: string | null; link?: string | null; readAt?: string | null; createdAt: string };

/** Cloche de notifications : compteur de non-lues (interrogé toutes les 60 s) et liste déroulante. */
export function NotificationBell({ align = "right" }: { align?: "right" | "left" }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[] | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Nettoyage au changement de compte ou à la déconnexion
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setItems(null);
      setUnread(0);
      setOpen(false);
    }
  }, [isAuthenticated, user?.id]);

  const refreshCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await studioApi<{ unread: number }>("/me/notifications/unread-count");
      setUnread(res.unread ?? 0);
    } catch {}
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    refreshCount();
    // Pas d'interrogation quand l'onglet est caché.
    const t = setInterval(() => document.visibilityState === "visible" && refreshCount(), 60000);
    return () => clearInterval(t);
  }, [isAuthenticated, refreshCount]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  if (!mounted || !isAuthenticated) return null;

  const isSafeLink = (l?: string | null): boolean => {
    if (!l) return false;
    const trimmed = l.trim();
    return trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.startsWith("/\\");
  };

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      try {
        const r = await studioApi<{ items: Notif[]; unread: number }>("/me/notifications?limit=10");
        setItems(r.items);
        setUnread(r.unread);
      } catch {
        setItems([]);
      }
    }
  };

  const markAll = async () => {
    const previousItems = items;
    const previousUnread = unread;
    setItems((list) => list?.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })) ?? null);
    setUnread(0);
    try {
      await studioApi("/me/notifications/read", { method: "POST", body: {} });
    } catch {
      // Annulation de la mise à jour optimiste en cas d'erreur serveur
      setItems(previousItems);
      setUnread(previousUnread);
    }
  };

  const openItem = async (n: Notif) => {
    setOpen(false);
    if (!n.readAt) {
      const previousItems = items;
      const previousUnread = unread;
      setItems((list) => list?.map((it) => (it.id === n.id ? { ...it, readAt: new Date().toISOString() } : it)) ?? null);
      setUnread((c) => Math.max(0, c - 1));
      try {
        await studioApi("/me/notifications/read", { method: "POST", body: { ids: [n.id] } });
      } catch {
        setItems(previousItems);
        setUnread(previousUnread);
      }
    }
    if (isSafeLink(n.link)) {
      router.push(n.link!);
    }
  };

  const deleteOne = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const previousItems = items;
    const previousUnread = unread;
    const target = items?.find((it) => it.id === id);
    if (!target) return;

    setItems((list) => list?.filter((it) => it.id !== id) ?? null);
    if (!target.readAt) {
      setUnread((c) => Math.max(0, c - 1));
    }

    try {
      await studioApi(`/me/notifications/${id}`, { method: "DELETE" });
    } catch {
      setItems(previousItems);
      setUnread(previousUnread);
    }
  };

  return (
    <div className="relative" ref={box}>
      <button
        onClick={toggle}
        aria-label={unread ? `${unread} notification(s) non lue(s)` : "Notifications"}
        aria-expanded={open}
        className="relative w-8 h-8 rounded-full bg-[#161616] border border-[#2A2A2A] text-[#B8B8B8] hover:text-white hover:border-[#FFBF00]/50 flex items-center justify-center"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#FFBF00] text-[#0B0B0B] text-[10px] font-extrabold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute ${align === "right" ? "right-0" : "left-0"} top-full mt-2 w-80 max-w-[90vw] bg-[#141414] border border-[#282828] rounded-2xl shadow-2xl z-[60] overflow-hidden`}>
          <div className="px-4 py-3 border-b border-[#222] flex items-center justify-between">
            <p className="text-sm font-bold text-white">Notifications</p>
            {unread > 0 && (
              <button onClick={markAll} className="text-[11px] text-[#FFBF00] font-bold hover:underline">
                Tout marquer comme lu
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {!items ? (
              <p className="p-6 text-center text-xs text-gray-500">Chargement…</p>
            ) : items.length === 0 ? (
              <p className="p-6 text-center text-xs text-gray-500">Aucune notification pour le moment.</p>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className={`group relative w-full text-left px-4 py-3 border-b border-[#1c1c1c] hover:bg-[#1A1A1A] flex items-start gap-3 transition-colors ${n.readAt ? "" : "bg-[#FFBF00]/5"}`}
                >
                  <button
                    type="button"
                    onClick={() => openItem(n)}
                    className="flex-1 min-w-0 flex gap-3 text-left focus:outline-none"
                  >
                    <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.readAt ? "bg-transparent" : "bg-[#FFBF00]"}`} />
                    <span className="min-w-0">
                      <span className="block text-xs font-bold text-white truncate">{n.title}</span>
                      {n.body && <span className="block text-[11px] text-[#B8B8B8] line-clamp-2">{n.body}</span>}
                      <span className="block text-[10px] text-[#757575] mt-0.5">{timeAgo(n.createdAt)}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => deleteOne(e, n.id)}
                    title="Supprimer la notification"
                    aria-label="Supprimer la notification"
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-[#262626] transition-all shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
          <Link href="/notifications" onClick={() => setOpen(false)} className="block text-center text-xs font-bold text-[#FFBF00] py-3 hover:bg-[#1A1A1A]">
            Voir toutes les notifications
          </Link>
        </div>
      )}
    </div>
  );
}
