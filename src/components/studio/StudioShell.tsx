"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { 
  Mic2, LayoutDashboard, Settings, PlusSquare, 
  BarChart3, Headphones, Menu, ChevronLeft, ChevronRight, CheckCircle, Clock, AlertTriangle
} from "lucide-react";

export function StudioShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // GSAP Animation for Sidebar toggling
    if (sidebarRef.current) {
      gsap.to(sidebarRef.current, {
        width: isSidebarOpen ? 260 : 64,
        duration: 0.4,
        ease: "power3.inOut"
      });
    }
  }, [isSidebarOpen]);

  const navItems = [
    { name: "Vue d'ensemble", href: "/studio", icon: LayoutDashboard },
    { name: "Mes Podcasts", href: "/studio/podcasts", icon: Mic2 },
    { name: "Nouvel Ã‰pisode", href: "/studio/episodes/new", icon: PlusSquare },
    { name: "Statistiques", href: "/studio/analytics", icon: BarChart3 },
    { name: "ParamÃ¨tres Studio", href: "/studio/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen w-full bg-[#0E0E0E] text-[#EDEDED] font-sans overflow-hidden">
      
      {/* Studio Minimalist Sidebar */}
      <div 
        ref={sidebarRef} 
        className="flex flex-col h-full bg-[#141414] border-r border-[#262626] shrink-0 z-20 relative overflow-hidden"
      >
        <div className="flex items-center h-16 px-4 shrink-0 justify-between">
          <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            <div className="w-8 h-8 rounded-lg bg-[#FFBF00] flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5 text-[#0B0B0B]" />
            </div>
            {isSidebarOpen && <span className="font-bold tracking-tight text-white">Studio Bamako</span>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-3 no-scrollbar">
          <div className="mb-4">
            {isSidebarOpen && <span className="text-[10px] font-semibold text-[#666666] uppercase tracking-wider px-2">Menu Principal</span>}
          </div>
          
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname?.startsWith(item.href) && item.href !== "/studio");
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-3 px-2 py-2 rounded-md transition-colors whitespace-nowrap ${
                  isActive 
                    ? "bg-[#262626] text-white" 
                    : "text-[#A0A0A0] hover:bg-[#1C1C1C] hover:text-white"
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-[#FFBF00]" : ""}`} />
                {isSidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </div>

        {/* Toggle Button at the bottom */}
        <div className="p-3 border-t border-[#262626] shrink-0">
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="flex items-center justify-center w-full h-10 rounded-md hover:bg-[#1C1C1C] transition-colors text-[#888888] hover:text-white"
          >
            {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0E0E0E] relative">
        {/* Top Header / Breadcrumbs */}
        <header className="h-14 shrink-0 flex items-center px-6 border-b border-[#262626] bg-[#0E0E0E]/80 backdrop-blur-md z-10 sticky top-0">
          <div className="flex items-center gap-2 text-sm text-[#A0A0A0]">
            <span>Bamako Podcast</span>
            <span>/</span>
            <span className="text-white font-medium capitalize">
              {pathname?.split('/').pop() || "Studio"}
            </span>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div 
          ref={contentRef}
          className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-10 no-scrollbar relative"
        >
          <div className="w-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

