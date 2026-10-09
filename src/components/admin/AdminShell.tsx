"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { 
  LayoutDashboard, Podcast, Mic2, Users, UserCog, 
  Library, Tags, ShieldAlert, BadgeCheck, FileDown, 
  BarChart3, Settings, Database, Activity, Shield, 
  ChevronLeft, ChevronRight, LogOut, ArrowLeft, CreditCard,
  Star, Loader2, LogIn, Lock
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { UserDropdown } from "../UserDropdown";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, isLoading, logout, setAuth } = useAuthStore();
  const router = useRouter();

  const [quickLoginLoading, setQuickLoginLoading] = useState(false);
  const [quickLoginError, setQuickLoginError] = useState("");

  const isSuperAdmin = user?.roles?.some(r => r.toUpperCase() === "SUPER_ADMIN") || false;
  const isAdmin = user?.roles?.some(r => r.toUpperCase() === "ADMIN") || false;
  const canAccessConsole = isSuperAdmin || isAdmin;

  const isPrototype = pathname === "/admin/prototype";

  const handleQuickAdminLogin = async () => {
    setQuickLoginLoading(true);
    setQuickLoginError("");
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          identifier: "admin@bamakopodcast.ml",
          password: "Admin@Bamako2026!",
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setAuth(json.data.user, json.data.accessToken, json.data.refreshToken);
      } else {
        setQuickLoginError(json.message || "Impossible de se connecter automatiquement.");
      }
    } catch (err: any) {
      setQuickLoginError(err.message || "Erreur de communication avec le serveur.");
    } finally {
      setQuickLoginLoading(false);
    }
  };

  useEffect(() => {
    if (sidebarRef.current) {
      gsap.to(sidebarRef.current, {
        width: isSidebarOpen ? 260 : 64,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  }, [isSidebarOpen]);

  const navGroups = [
    {
      label: "Gestion",
      items: [
        { name: "Tableau de bord", href: "/admin/dashboard", icon: LayoutDashboard },
        { name: "Ã‰missions", href: "/admin/podcasts", icon: Podcast },
        { name: "Ã‰pisodes", href: "/admin/episodes", icon: Mic2 },
        { name: "Prototype Ã‰crans", href: "/admin/prototype", icon: Star },
        { name: "CrÃ©ateurs", href: "/admin/creators", icon: UserCog },
        { name: "Utilisateurs", href: "/admin/users", icon: Users },
        { name: "Tarifs Studio", href: "/admin/tarifs", icon: CreditCard },
      ]
    },
    {
      label: "Ã‰ditorial",
      items: [
        { name: "SÃ©lections et collections", href: "/admin/editorial", icon: Library },
        { name: "CatÃ©gories et langues", href: "/admin/categories", icon: Tags },
      ]
    },
    {
      label: "ModÃ©ration",
      items: [
        { name: "Signalements", href: "/admin/reports", icon: ShieldAlert },
        { name: "Revendications", href: "/admin/claims", icon: BadgeCheck },
      ]
    },
    {
      label: "Suivi",
      items: [
        { name: "Imports et mÃ©dias", href: "/admin/media", icon: FileDown },
        { name: "Statistiques", href: "/admin/analytics", icon: BarChart3 },
      ]
    }
  ];

  const superAdminGroup = {
    label: "Super Admin",
    items: [
      { name: "Administrateurs et rÃ´les", href: "/admin/roles", icon: Shield },
      { name: "ParamÃ¨tres", href: "/admin/settings", icon: Settings },
      { name: "Journal des actions", href: "/admin/audit", icon: Activity },
      { name: "Ã‰tat du systÃ¨me", href: "/admin/system", icon: Database },
    ]
  };

  return (
    <div className="flex h-screen w-full bg-[#0E0E0E] text-[#EDEDED] font-sans overflow-hidden selection:bg-[#FFBF00] selection:text-[#0B0B0B]">
      
      {/* Admin Minimalist Sidebar */}
      <div 
        ref={sidebarRef} 
        className="flex flex-col h-full bg-[#141414] border-r border-[#262626] shrink-0 z-20 relative overflow-hidden"
      >
        <div className="flex items-center h-14 px-4 shrink-0 justify-between">
          {isSidebarOpen && (
            <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
              <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold tracking-tight text-white text-sm">Administration</span>
            </div>
          )}
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className={`flex items-center justify-center w-8 h-8 rounded-md hover:bg-[#1C1C1C] transition-colors text-[#888888] hover:text-white shrink-0 ${!isSidebarOpen ? "mx-auto" : ""}`}
          >
            {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-6 px-3 scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-transparent">
          {navGroups.map((group, i) => (
            <div key={i} className="flex flex-col gap-1">
              {isSidebarOpen && (
                <span className="text-[10px] font-semibold text-[#666666] uppercase tracking-wider px-2 mb-1">
                  {group.label}
                </span>
              )}
              {group.items.map((item) => {
                const isActive = pathname === item.href || (pathname?.startsWith(item.href) && item.href !== "/admin/dashboard");
                const Icon = item.icon;
                
                return (
                  <Link 
                    key={item.name} 
                    href={item.href}
                    className={`flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                      isActive 
                        ? "bg-[#262626] text-white" 
                        : "text-[#A0A0A0] hover:bg-[#1C1C1C] hover:text-white"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#FFBF00]" : ""}`} />
                    {isSidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          ))}

          {/* Super Admin Section */}
          {isSuperAdmin && (
            <div className="flex flex-col gap-1 mt-2 pt-4 border-t border-[#262626]">
              {isSidebarOpen && (
                <span className="text-[10px] font-semibold text-red-500 uppercase tracking-wider px-2 mb-1">
                  {superAdminGroup.label}
                </span>
              )}
              {superAdminGroup.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                
                return (
                  <Link 
                    key={item.name} 
                    href={item.href}
                    className={`flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                      isActive 
                        ? "bg-[#262626] text-white" 
                        : "text-[#A0A0A0] hover:bg-[#1C1C1C] hover:text-white"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-red-500" : ""}`} />
                    {isSidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-[#262626] shrink-0 space-y-2">
          <Link 
            href="/"
            className={`flex items-center gap-3 w-full h-9 px-2 rounded-md hover:bg-[#1C1C1C] transition-colors text-[#888888] hover:text-white ${isSidebarOpen ? "" : "justify-center"}`}
          >
            <ArrowLeft className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="text-sm font-medium">Retour au site</span>}
          </Link>
          <button 
            onClick={async () => {
              await logout();
              router.push("/login?tab=login");
            }}
            className={`flex items-center gap-3 w-full h-9 px-2 rounded-md hover:bg-[#1C1C1C] transition-colors text-red-500 hover:text-red-400 ${isSidebarOpen ? "" : "justify-center"}`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="text-sm font-medium">DÃ©connexion</span>}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0E0E0E] relative">
        <header className="h-14 shrink-0 flex items-center px-6 border-b border-[#262626] bg-[#0E0E0E]/90 backdrop-blur-md z-10 sticky top-0 justify-between">
          <div className="flex items-center gap-2 text-sm text-[#A0A0A0]">
            <span>Admin</span>
            <span>/</span>
            <span className="text-white font-medium capitalize">
              {pathname?.split('/').pop() || "Dashboard"}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <UserDropdown />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-10 no-scrollbar relative">
          <div className="w-full">
            {isPrototype ? (
              children
            ) : isLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
                <Loader2 className="w-8 h-8 text-[#FFBF00] animate-spin" />
                <span className="text-sm text-[#888888] font-medium">VÃ©rification de la session administrateur...</span>
              </div>
            ) : !isAuthenticated ? (
              <div className="max-w-xl mx-auto my-8 bg-[#171717] border border-[#2A2A2A] rounded-2xl p-8 text-center shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-[#222222] border border-[#333333] flex items-center justify-center mx-auto mb-5 text-[#FFBF00]">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Session Administrateur Requise</h2>
                <p className="text-sm text-[#999999] mb-6 leading-relaxed">
                  Lâ€™accÃ¨s aux donnÃ©es rÃ©elles de lâ€™administration nÃ©cessite une session active avec le rÃ´le Administrateur ou Super Admin.
                </p>

                <div className="bg-[#101010] border border-[#262626] rounded-xl p-4 mb-6 text-left space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#FFBF00] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    Compte DÃ©mo Administrateur
                  </div>
                  <div className="text-xs text-[#CCCCCC] font-mono flex items-center justify-between">
                    <span className="text-[#888888]">Identifiant :</span>
                    <span className="text-white font-medium">admin@bamakopodcast.ml</span>
                  </div>
                  <div className="text-xs text-[#CCCCCC] font-mono flex items-center justify-between">
                    <span className="text-[#888888]">Mot de passe :</span>
                    <span className="text-white font-medium">Admin@Bamako2026!</span>
                  </div>
                </div>

                {quickLoginError && (
                  <div className="mb-4 p-3 bg-red-950/40 border border-red-800 text-red-300 text-xs rounded-lg text-left">
                    {quickLoginError}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleQuickAdminLogin}
                    disabled={quickLoginLoading}
                    className="px-5 py-3 rounded-xl bg-[#FFBF00] hover:bg-[#E5AC00] text-[#0B0B0B] font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    {quickLoginLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Connexion en cours...
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        Connexion Administrateur 1-clic
                      </>
                    )}
                  </button>

                  <Link
                    href="/admin/prototype"
                    className="px-5 py-3 rounded-xl bg-[#222222] hover:bg-[#2A2A2A] border border-[#333333] text-white font-medium text-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Star className="w-4 h-4 text-[#FFBF00]" />
                    Prototype (12 Ã‰crans)
                  </Link>
                </div>

                <div className="mt-6 pt-5 border-t border-[#262626] text-xs text-[#777777]">
                  Ou connectez-vous avec un autre compte depuis la{" "}
                  <Link
                    href={`/login?redirect=${encodeURIComponent(pathname || "/admin/dashboard")}`}
                    className="text-[#FFBF00] hover:underline font-medium"
                  >
                    page de connexion standard
                  </Link>.
                </div>
              </div>
            ) : !canAccessConsole ? (
              <div className="max-w-md mx-auto my-16 bg-[#171717] border border-red-900/40 rounded-2xl p-8 text-center shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-red-950/60 border border-red-800/60 flex items-center justify-center mx-auto mb-4 text-red-400">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">AccÃ¨s Non AutorisÃ©</h2>
                <p className="text-sm text-[#A0A0A0] mb-6 leading-relaxed">
                  Vous Ãªtes actuellement connectÃ© avec le compte <strong className="text-white">{user?.email}</strong>. Ce compte ne possÃ¨de pas les privilÃ¨ges requis (Administrateur ou Super Admin).
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={async () => {
                      await logout();
                      router.push("/login?tab=login");
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#FFBF00] text-[#0B0B0B] font-bold text-sm hover:bg-[#E5AC00] transition-colors"
                  >
                    Se reconnecter avec un compte administrateur
                  </button>
                  <Link
                    href="/"
                    className="w-full py-2.5 rounded-xl bg-[#222222] border border-[#333333] text-white font-medium text-sm hover:bg-[#2A2A2A] transition-colors text-center"
                  >
                    Retour Ã  lâ€™accueil public
                  </Link>
                </div>
              </div>
            ) : (
              children
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

