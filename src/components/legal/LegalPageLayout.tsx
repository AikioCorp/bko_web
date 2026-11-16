"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  FileText,
  Building,
  Cookie,
  UserX,
  Scale,
  Info,
  Printer,
  Mail,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { Footer } from "@/components/Footer";

interface LegalTab {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const LEGAL_TABS: LegalTab[] = [
  { name: "Confidentialité", href: "/privacy", icon: Shield, badge: "YouTube & APDP" },
  { name: "Conditions d'utilisation", href: "/terms", icon: FileText },
  { name: "Mentions légales", href: "/legal", icon: Building },
  { name: "Cookies", href: "/cookies", icon: Cookie },
  { name: "Suppression des données", href: "/data-deletion", icon: UserX, badge: "Google Play" },
  { name: "Règles & Copyright", href: "/community-guidelines", icon: Scale },
  { name: "À propos", href: "/about", icon: Info },
];

interface LegalPageLayoutProps {
  title: string;
  subtitle: string;
  badgeText?: string;
  lastUpdated?: string;
  children: React.ReactNode;
}

export function LegalPageLayout({
  title,
  subtitle,
  badgeText = "Document officiel",
  lastUpdated = "26 Octobre 2026",
  children,
}: LegalPageLayoutProps) {
  const pathname = usePathname() || "";

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white flex flex-col justify-between">
      <div>
        {/* En-tête officiel */}
        <section className="bg-[#121212] border-b border-[#222222] pt-8 pb-10 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-[#888888] mb-4">
              <Link href="/" className="hover:text-white transition-colors">
                Accueil
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-[#555555]" />
              <span className="text-[#B8B8B8]">Espace Légal & Conformité</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#555555]" />
              <span className="text-[#FFBF00] font-medium">{title}</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-3 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#FFBF00] text-[#0B0B0B]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {badgeText}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-[#1F1F1F] text-[#CCCCCC] border border-[#2D2D2D]">
                    <Calendar className="w-3.5 h-3.5 text-[#888888]" />
                    Dernière mise à jour : {lastUpdated}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                  {title}
                </h1>
                <p className="text-sm sm:text-base text-[#A0A0A0] leading-relaxed">
                  {subtitle}
                </p>
              </div>

              {/* Actions d'impression & contact */}
              <div className="flex items-center gap-2.5 shrink-0 print:hidden">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#1F1F1F] hover:bg-[#2A2A2A] text-white border border-[#333333] transition-colors"
                  title="Imprimer ou enregistrer en PDF"
                >
                  <Printer className="w-3.5 h-3.5 text-[#CCCCCC]" />
                  <span>Imprimer</span>
                </button>
                <Link
                  href="mailto:privacy@bamakopodcast.com"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Contacter le DPO</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Barre de navigation transversale */}
        <nav className="bg-[#141414] border-b border-[#222222] sticky top-0 z-30 overflow-x-auto scrollbar-none print:hidden">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-1 sm:gap-2 py-2 min-w-max">
              {LEGAL_TABS.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = pathname === tab.href;

                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? "bg-[#FFBF00] text-[#0B0B0B] font-bold shadow-sm"
                        : "text-[#AAAAAA] hover:text-white hover:bg-[#1E1E1E]"
                    }`}
                  >
                    <IconComponent
                      className={`w-4 h-4 ${isActive ? "text-[#0B0B0B]" : "text-[#777777]"}`}
                    />
                    <span>{tab.name}</span>
                    {tab.badge && (
                      <span
                        className={`text-[9.5px] px-1.5 py-0.5 rounded ${
                          isActive
                            ? "bg-[#0B0B0B]/20 text-[#0B0B0B] font-bold"
                            : "bg-[#252525] text-[#888888]"
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Contenu principal */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-14">
          {children}
        </main>
      </div>

      {/* Footer global */}
      <Footer />
    </div>
  );
}
