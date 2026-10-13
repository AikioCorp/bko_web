"use client";

import React from "react";
import { UnifiedProfileView } from "@/components/profile/UnifiedProfileView";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      {/* Header */}
      <header className="border-b border-[#262626] bg-[#0B0B0B]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-lg font-bold">Mon Profil & Paramètres</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <UnifiedProfileView portalContext="public" />
      </main>
    </div>
  );
}
