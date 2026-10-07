"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { 
  LayoutDashboard, Podcast, Mic2, Users, UserCog, 
  Library, Tags, ShieldAlert, BadgeCheck, FileDown, 
  BarChart3, Settings, Database, Activity, Shield, 
  ChevronLeft, ChevronRight, LogOut, ArrowLeft, CreditCard
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { UserDropdown } from "../UserDropdown";
import { useRouter } from "next/navigation";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuthStore();
  const router = useRouter();
  
  const isSuperAdmin = user?.roles?.some(r => r.toUpperCase() === "SUPER_ADMIN") || false;

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
        { name: "Podcasts", href: "/admin/podcasts", icon: Podcast },
        { name: "Épisodes", href: "/admin/episodes", icon: Mic2 },
        { name: "Créateurs", href: "/admin/creators", icon: UserCog },
        { name: "Utilisateurs", href: "/admin/users", icon: Users },
        { name: "Tarifs Studio", href: "/admin/tarifs", icon: CreditCard },
      ]
    },
    {
      label: "Éditorial",
      items: [
        { name: "Sélections et collections", href: "/admin/editorial", icon: Library },
        { name: "Catégories et langues", href: "/admin/categories", icon: Tags },
      ]
    },
    {
      label: "Modération",
      items: [
        { name: "Signalements", href: "/admin/reports", icon: ShieldAlert },
        { name: "Revendications", href: "/admin/claims", icon: BadgeCheck },
      ]
    },
    {
      label: "Suivi",
      items: [
        { name: "Imports et médias", href: "/admin/media", icon: FileDown },
        { name: "Statistiques", href: "/admin/analytics", icon: BarChart3 },
      ]
    }
  ];

  const superAdminGroup = {
    label: "Super Admin",
    items: [
      { name: "Administrateurs et rôles", href: "/admin/roles", icon: Shield },
      { name: "Paramètres", href: "/admin/settings", icon: Settings },
      { name: "Journal des actions", href: "/admin/audit", icon: Activity },
      { name: "État du système", href: "/admin/system", icon: Database },
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
            {isSidebarOpen && <span className="text-sm font-medium">Déconnexion</span>}
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
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
