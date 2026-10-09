"use client";
import React from "react";
import { Hammer } from "lucide-react";

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] flex items-center justify-center mb-6">
        <Hammer className="w-8 h-8 text-[#FFBF00]" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Page en construction</h1>
      <p className="text-[#888888] max-w-md">
        Cette interface de gestion (system) est en cours de développement pour adopter le nouveau design épuré.
      </p>
    </div>
  );
}

