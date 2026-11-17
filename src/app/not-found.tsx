import Link from "next/link";
import { Home, Compass, Radio } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 text-white">
      <div className="max-w-md w-full bg-[#141414] border border-[#262626] rounded-3xl p-8 text-center space-y-5 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-[#1C180E] border border-[#FFBF00]/40 flex items-center justify-center mx-auto text-[#FFBF00]">
          <Radio className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-extrabold uppercase tracking-widest text-[#FFBF00]">Erreur 404</p>
          <h1 className="text-2xl font-black tracking-tight">Page introuvable</h1>
          <p className="text-sm text-[#A0A0A0] leading-relaxed">
            La page ou l&apos;émission que vous recherchez n&apos;existe pas ou a été déplacée.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold text-xs transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Accueil</span>
          </Link>
          <Link
            href="/explore"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1F1F1F] hover:bg-[#2A2A2A] text-white border border-[#2F2F2F] font-semibold text-xs transition-colors"
          >
            <Compass className="w-4 h-4 text-[#FFBF00]" />
            <span>Explorer</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
