"use client";

import React from "react";
import Link from "next/link";
import { Plus, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StudioEpisodesPage() {
  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#222] pb-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Radio className="w-7 h-7 text-[#FFBF00]" />
            Mes Épisodes
          </h1>
          <p className="text-[#888888]">
            Retrouvez tous vos épisodes publiés, en brouillon ou programmés.
          </p>
        </div>
        <Button className="bg-[#FFBF00] hover:bg-[#E5A800] text-[#0B0B0B] font-bold" asChild>
          <Link href="/studio/episodes/new">
            <Plus className="w-4 h-4 mr-2" />
            Nouvel Épisode
          </Link>
        </Button>
      </div>
      
      <div className="border border-[#222] rounded-xl p-12 text-center flex flex-col items-center bg-[#111]">
        <div className="w-16 h-16 bg-[#222] rounded-full flex items-center justify-center mb-4">
          <Radio className="w-8 h-8 text-[#888]" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Aucun épisode</h3>
        <p className="text-[#888] max-w-md mb-6">
          La liste de vos épisodes s'affichera ici. En attendant, commencez par uploader votre premier enregistrement.
        </p>
        <Button className="bg-[#1C1C1C] border border-[#333] hover:bg-[#2A2A2A] text-white font-bold" asChild>
          <Link href="/studio/episodes/new">Uploader un fichier audio</Link>
        </Button>
      </div>
    </div>
  );
}
