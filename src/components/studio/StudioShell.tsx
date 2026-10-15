"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import { gsap } from "gsap";
import { 
  Radio, 
  LayoutDashboard, 
  Settings, 
  PlusCircle, 
  BarChart3, 
  Headphones, 
  Mic2, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink,
  ArrowLeft,
  Sparkles,
  User,
  ShieldCheck,
  Menu,
  X,
  Video
} from "lucide-react";
import { fetchApi } from "@/lib/api";

const fetcher = (url: string) => fetchApi(url).then((res) => res.data);

export function StudioShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Fetch creator profile to display identity & links
  const { data: creatorProfile } = useSWR("/me/creator-profile", fetcher, {
    revalidateOnFocus: false,
  });

  useEffect(() => {
    // GSAP animation for desktop sidebar width transition
    if (sidebarRef.current && window.innerWidth >= 768) {
      gsap.to(sidebarRef.current, {
        width: isSidebarOpen ? 260 : 72,
        duration: 0.35,
        ease: "power3.inOut"
      });
    }
  }, [isSidebarOpen]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const mainNav = [
    { name: "Vue d'ensemble", href: "/studio", icon: LayoutDashboard, exact: true },
    { name: "Mes Podcasts", href: "/studio/podcasts", icon: Radio },
    { name: "Mes Épisodes", href: "/studio/episodes", icon: Headphones },
    { name: "Statistiques", href: "/studio/analytics", icon: BarChart3 },
  ];

  const creationNav = [
    { name: "Nouvel Épisode", href: "/studio/episodes/new", icon: PlusCircle },
    { name: "Nouvelle Émission", href: "/studio/podcasts/new", icon: Mic2 },
    { name: "Connecter YouTube", href: "/studio/import-youtube", icon: Video },
  ];

  const configNav = [
    { name: "Paramètres Studio", href: "/studio/settings", icon: Settings },
    { name: "Profil & Compte", href: "/studio/profile", icon: User },
  ];

  return (
    <div className="flex h-screen w-full bg-[#0A0A0A] text-[#EDEDED] font-sans overflow-hidden">
      
      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* Studio Sidebar (Desktop + Mobile Drawer) */}
      <aside 
        ref={sidebarRef} 
        className={`fixed md:relative inset-y-0 left-0 z-50 md:z-20 flex flex-col h-full bg-[#111111] border-r border-[#222222] shrink-0 transition-transform md:transition-none duration-300 ${
          isMobileMenuOpen ? "translate-x-0 w-72" : "-translate-x-full md:translate-x-0"
        } ${isSidebarOpen ? "md:w-[260px]" : "md:w-[72px]"}`}
      >
        {/* Brand Header */}
        <div className="flex items-center h-16 px-4 shrink-0 justify-between border-b border-[#1E1E1E]">
          <Link href="/studio" className="flex items-center gap-3 overflow-hidden whitespace-nowrap group">
            <div className="w-9 h-9 rounded-xl bg-[#FFBF00] flex items-center justify-center shrink-0 shadow-sm">
              <Headphones className="w-5 h-5 text-[#0B0B0B]" />
            </div>
            {(isSidebarOpen || isMobileMenuOpen) && (
              <div className="flex flex-col">
                <span className="font-bold tracking-tight text-white text-base leading-tight group-hover:text-[#FFBF00] transition-colors">
                  Bamako Studio
                </span>
                <span className="text-[10px] font-semibold text-[#888888] tracking-widest uppercase">
                  Espace Créateur
                </span>
              </div>
            )}
          </Link>

          {/* Mobile close button */}
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-[#888888] hover:text-white hover:bg-[#1E1E1E]"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Creator Mini Identity Card */}
        {(isSidebarOpen || isMobileMenuOpen) && (
          <div className="px-3 pt-3 pb-2 shrink-0">
            <div className="p-2.5 rounded-xl bg-[#161616] border border-[#222222] flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#222222] border border-[#333333] shrink-0 overflow-hidden flex items-center justify-center text-sm font-bold text-[#FFBF00]">
                {creatorProfile?.avatar ? (
                  <img src={creatorProfile.avatar} alt={creatorProfile.displayName} className="w-full h-full object-cover" />
                ) : (
                  creatorProfile?.displayName?.slice(0, 2).toUpperCase() || "CR"
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white truncate block">
                    {creatorProfile?.displayName || "Studio Créateur"}
                  </span>
                  <ShieldCheck className="w-3.5 h-3.5 text-[#FFBF00] shrink-0" />
                </div>
                {creatorProfile?.slug ? (
                  <Link 
                    href={`/creators/${creatorProfile.slug}`} 
                    target="_blank"
                    className="text-[11px] text-[#888888] hover:text-[#FFBF00] flex items-center gap-1 transition-colors mt-0.5 truncate"
                  >
                    <span>Page publique</span>
                    <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                  </Link>
                ) : (
                  <span className="text-[11px] text-[#777777] block truncate">Espace actif</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto py-3 px-3 flex flex-col gap-5 no-scrollbar">
          
          {/* Section 1: Dashboard & Catalog */}
          <div className="flex flex-col gap-1">
            {(isSidebarOpen || isMobileMenuOpen) && (
              <span className="text-[10px] font-semibold text-[#666666] uppercase tracking-wider px-2 mb-1">
                Tableau de bord
              </span>
            )}
            {mainNav.map((item) => {
              const isActive = item.exact 
                ? pathname === item.href 
                : pathname === item.href || (pathname?.startsWith(item.href) && item.href !== "/studio");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.name}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    isActive 
                      ? "bg-[#222222] text-white border-l-2 border-[#FFBF00]" 
                      : "text-[#999999] hover:bg-[#181818] hover:text-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#FFBF00]" : "text-[#777777]"}`} />
                  {(isSidebarOpen || isMobileMenuOpen) && <span>{item.name}</span>}
                </Link>
              );
            })}
          </div>

          {/* Section 2: Quick Creation */}
          <div className="flex flex-col gap-1">
            {(isSidebarOpen || isMobileMenuOpen) && (
              <span className="text-[10px] font-semibold text-[#666666] uppercase tracking-wider px-2 mb-1">
                Création
              </span>
            )}
            {creationNav.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.name}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    isActive 
                      ? "bg-[#222222] text-white border-l-2 border-[#FFBF00]" 
                      : "text-[#999999] hover:bg-[#181818] hover:text-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#FFBF00]" : "text-[#777777]"}`} />
                  {(isSidebarOpen || isMobileMenuOpen) && <span>{item.name}</span>}
                </Link>
              );
            })}
          </div>

          {/* Section 3: Configuration */}
          <div className="flex flex-col gap-1">
            {(isSidebarOpen || isMobileMenuOpen) && (
              <span className="text-[10px] font-semibold text-[#666666] uppercase tracking-wider px-2 mb-1">
                Paramètres
              </span>
            )}
            {configNav.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.name}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    isActive 
                      ? "bg-[#222222] text-white border-l-2 border-[#FFBF00]" 
                      : "text-[#999999] hover:bg-[#181818] hover:text-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#FFBF00]" : "text-[#777777]"}`} />
                  {(isSidebarOpen || isMobileMenuOpen) && <span>{item.name}</span>}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-[#1E1E1E] shrink-0 flex flex-col gap-2">
          {/* Back to Listener Web App */}
          <Link
            href="/"
            title="Quitter le Studio"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-[#888888] hover:text-white hover:bg-[#181818] transition-colors whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4 shrink-0 text-[#888888]" />
            {(isSidebarOpen || isMobileMenuOpen) && <span>Retour au site public</span>}
          </Link>

          {/* Desktop Toggle Button */}
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="hidden md:flex items-center justify-center w-full h-9 rounded-lg hover:bg-[#181818] transition-colors text-[#666666] hover:text-white"
            aria-label={isSidebarOpen ? "Réduire le menu latéral" : "Agrandir le menu latéral"}
          >
            {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0A0A0A] relative overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 shrink-0 flex items-center justify-between px-4 md:px-8 border-b border-[#1E1E1E] bg-[#0E0E0E] z-10 sticky top-0">
          
          {/* Left: Mobile Toggle & Breadcrumbs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-[#888888] hover:text-white hover:bg-[#181818]"
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs md:text-sm text-[#777777]">
              <span className="font-medium text-white">Studio Bamako</span>
              <span>/</span>
              <span className="text-[#CCCCCC] capitalize">
                {pathname === "/studio" 
                  ? "Vue d'ensemble" 
                  : pathname?.split('/').pop()?.replace('-', ' ') || "Studio"}
              </span>
            </div>
          </div>

          {/* Right: Quick Actions */}
          <div className="flex items-center gap-2.5">
            {creatorProfile?.slug && (
              <Link 
                href={`/creators/${creatorProfile.slug}`} 
                target="_blank"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2A2A2A] bg-[#141414] hover:bg-[#1C1C1C] text-[#AAAAAA] hover:text-white text-xs font-medium transition-colors"
              >
                <span>Voir profil public</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}

            <Link
              href="/studio/podcasts/new"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2A2A2A] bg-[#141414] hover:bg-[#1C1C1C] text-white text-xs font-medium transition-colors"
            >
              <Mic2 className="w-3.5 h-3.5 text-[#FFBF00]" />
              <span>Nouvelle Émission</span>
            </Link>

            <Link
              href="/studio/episodes/new"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#FFBF00] hover:bg-[#E5A800] text-[#0A0A0A] text-xs font-bold transition-colors shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publier un épisode</span>
            </Link>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main 
          ref={contentRef}
          className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 no-scrollbar relative"
        >
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
