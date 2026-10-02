"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Mic2,
  ShieldAlert,
  Users,
  HardDrive,
  Settings,
  FileCheck2,
  Globe2,
  LogOut,
  Menu,
  X,
  ArrowLeft,
  KeyRound,
  ScrollText,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { adminApi } from "@/lib/adminApi";
import { NotificationBell } from "@/components/NotificationBell";
import { AccessProvider, AdminAccess } from "@/components/admin/access";

// Chaque entrée n'apparaît que si la personne détient la permission "view" correspondante.
const NAV = [
  { href: "/admin/dashboard", label: "Supervision & Métriques", icon: Activity, perm: "dashboard.view" },
  { href: "/admin/catalog", label: "Podcasts & Séries", icon: Mic2, perm: "catalog.view" },
  { href: "/admin/moderation", label: "Modération & Signalements", icon: ShieldAlert, perm: "moderation.view" },
  { href: "/admin/claims", label: "Revendications", icon: FileCheck2, perm: "claims.view" },
  { href: "/admin/users", label: "Créateurs & Utilisateurs", icon: Users, perm: "users.view" },
  { href: "/admin/roles", label: "Rôles & Permissions", icon: KeyRound, perm: "roles.view" },
  { href: "/admin/markets", label: "Marchés", icon: Globe2, perm: "markets.view" },
  { href: "/admin/storage", label: "Stockage & Tâches", icon: HardDrive, perm: "storage.view" },
  { href: "/admin/audit", label: "Journal d'audit", icon: ScrollText, perm: "audit.view" },
  { href: "/admin/settings", label: "Configuration", icon: Settings, perm: "settings.view" },
];

// La console s'affiche en plein écran par-dessus le shell public (Sidebar/Header du site).
export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const [access, setAccess] = useState<AdminAccess | null>(null);
  const [accessError, setAccessError] = useState(false);

  // Les droits viennent du serveur (jamais déduits du token) : un retrait s'applique aussitôt.
  useEffect(() => {
    if (!isAuthenticated) return;
    adminApi<AdminAccess>("/admin/access")
      .then(setAccess)
      .catch(() => setAccessError(true));
  }, [isAuthenticated, pathname]);

  const can = (perm: string) => !!access?.permissions.includes(perm);
  const hasConsole = !!access && access.permissions.length > 0;
  const current = NAV.find((n) => pathname?.startsWith(n.href));
  const pageDenied = !!access && !!current && !can(current.perm);

  if (isAuthenticated && !access && !accessError) {
    return <div className="fixed inset-0 z-50 bg-[#0B0B0B] flex items-center justify-center text-sm text-gray-500">Chargement de vos droits…</div>;
  }

  if (!isAuthenticated || !hasConsole) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0B0B0B] flex items-center justify-center p-6">
        <div className="max-w-sm text-center space-y-4">
          <ShieldAlert className="w-10 h-10 text-[#FFBF00] mx-auto" />
          <h1 className="text-xl font-bold text-white">Accès réservé</h1>
          <p className="text-sm text-gray-400">
            {isAuthenticated
              ? "Votre compte n'a pas les droits d'accès à la console d'administration."
              : "Connectez-vous avec un compte d'administration pour continuer."}
          </p>
          <Link
            href={isAuthenticated ? "/" : "/login"}
            className="inline-block bg-[#FFBF00] text-[#0B0B0B] text-sm font-bold px-4 py-2 rounded-lg"
          >
            {isAuthenticated ? "Retour au site" : "Se connecter"}
          </Link>
        </div>
      </div>
    );
  }

  const nav = (
    <nav className="space-y-1" aria-label="Navigation d'administration">
      {NAV.filter((n) => can(n.perm)).map((n) => {
        const active = pathname?.startsWith(n.href);
        const Icon = n.icon;
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              active ? "bg-[#FFBF00] text-[#0B0B0B]" : "text-gray-300 hover:bg-[#1c1c1c]"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {n.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0B0B] text-white flex">
      {/* Sidebar bureau */}
      <aside className="hidden lg:flex w-72 shrink-0 flex-col gap-6 p-5 border-r border-[#1c1c1c] overflow-y-auto">
        <div>
          <p className="font-extrabold text-lg">Bamako Podcast</p>
          <p className="text-[10px] font-bold tracking-widest text-[#FFBF00]">ADMINISTRATION / CONSOLE</p>
        </div>
        {nav}
        <div className="mt-auto space-y-2">
          <Link href="/" className="flex items-center gap-2 text-xs text-gray-400 hover:text-white px-3">
            <ArrowLeft className="w-3.5 h-3.5" /> Retour au site
          </Link>
          <button
            onClick={async () => {
              await logout();
              router.push("/login");
            }}
            className="w-full flex items-center justify-center gap-2 bg-[#1c1c1c] hover:bg-[#262626] text-xs font-bold rounded-xl py-2.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Déconnexion sécurisée
          </button>
        </div>
      </aside>

      {/* Menu mobile */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-[55] bg-black/70" onClick={() => setOpen(false)}>
          <aside className="w-72 h-full bg-[#0B0B0B] p-5 space-y-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="font-extrabold">Administration</p>
              <button onClick={() => setOpen(false)} aria-label="Fermer le menu">
                <X className="w-5 h-5" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 shrink-0 flex items-center justify-between gap-4 px-4 sm:px-8 border-b border-[#1c1c1c]">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Ouvrir le menu">
            <Menu className="w-6 h-6" />
          </button>
          <div className="hidden lg:block text-xs text-gray-500">Console d'administration</div>
          <div className="flex items-center gap-3 ml-auto">
            <NotificationBell />
            <div className="text-right leading-tight">
              <p className="text-sm font-bold">{user?.fullName}</p>
              <p className="text-[10px] uppercase tracking-wide text-gray-400">{access?.isSuperAdmin ? "Super Admin" : access?.roles[0]}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#FFBF00] text-[#0B0B0B] font-extrabold flex items-center justify-center">
              {user?.fullName?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {pageDenied ? (
              <div className="py-24 text-center space-y-3">
                <ShieldAlert className="w-10 h-10 text-[#FFBF00] mx-auto" />
                <h1 className="text-xl font-bold">Accès non autorisé</h1>
                <p className="text-sm text-gray-400">Votre rôle ne donne pas accès à cette page.</p>
              </div>
            ) : (
              <AccessProvider value={access!}>{children}</AccessProvider>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
