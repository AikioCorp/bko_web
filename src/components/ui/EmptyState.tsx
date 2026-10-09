"use client";

import React from "react";
import { SearchX, Compass, TrendingUp, RefreshCw } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  query?: string;
  onResetQuery?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "Aucun rÃ©sultat trouvÃ©",
  query,
  onResetQuery,
}) => {
  return (
    <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-8 md:p-12 text-center max-w-2xl mx-auto space-y-6 shadow-xl">
      <div className="w-16 h-16 bg-[#E5A93C]/10 border border-[#E5A93C]/30 text-[#E5A93C] rounded-full flex items-center justify-center mx-auto">
        <SearchX className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-extrabold text-white">{title}</h3>
        {query && (
          <p className="text-sm text-gray-400">
            Aucun contenu ne correspond Ã  la recherche <span className="text-[#E5A93C] font-semibold">"{query}"</span>.
          </p>
        )}
      </div>

      {/* SuggÃ©rer des alternatives */}
      <div className="bg-[#0A0D14] border border-[#1E2638] rounded-xl p-4 text-left space-y-2 text-xs text-gray-300">
        <p className="font-bold text-white mb-1">ðŸ’¡ Suggestions pour trouver du contenu :</p>
        <ul className="list-disc list-inside space-y-1 text-gray-400">
          <li>VÃ©rifiez l'orthographe des termes recherchÃ©s.</li>
          <li>Essayez un nom d'hÃ´te, un sujet ou une ville (ex: *Bamako*, *Bambara*, *Sahel*).</li>
          <li>Explorez directement nos thÃ©matiques phares ci-dessous.</li>
        </ul>
      </div>

      <div className="flex flex-wrap justify-center gap-4 pt-2">
        {onResetQuery && (
          <button
            onClick={onResetQuery}
            className="bg-[#1E2638] text-white px-5 py-2.5 rounded-full text-xs font-bold hover:bg-[#2A344A] transition flex items-center space-x-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>RÃ©initialiser la recherche</span>
          </button>
        )}

        <a
          href="/explore"
          className="bg-[#E5A93C] text-black px-5 py-2.5 rounded-full text-xs font-bold hover:bg-[#F5B82E] transition flex items-center space-x-2 shadow"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Explorer les catÃ©gories</span>
        </a>
      </div>
    </div>
  );
};

