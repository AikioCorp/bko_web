"use client";

import React, { useState } from "react";
import { Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import SuggestModal from "./SuggestModal";

export default function SuggestBanner() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="w-full bg-[#111111] border border-[#222222] rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:border-[#333333]">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-full border border-[#FFBF00]/30 bg-[#FFBF00]/10 flex items-center justify-center shrink-0">
            <Radio className="w-6 h-6 text-[#FFBF00]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white tracking-tight">
              Vous ne trouvez pas votre voix favorite ?
            </h3>
            <p className="text-[#888888] text-sm">
              SuggÃ©rez un griot, un animateur radio ou un studio indÃ©pendant de Bamako.
            </p>
          </div>
        </div>
        <Button 
          className="shrink-0 bg-[#222222] hover:bg-[#333333] text-white border border-[#444444] rounded-full px-6 py-5 font-medium transition-all hover:scale-105"
          onClick={() => setIsModalOpen(true)}
        >
          Proposer une Ã©mission
        </Button>
      </div>

      <SuggestModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

