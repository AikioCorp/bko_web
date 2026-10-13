import Link from "next/link";
import { Mic2, Clapperboard, Crown, ChevronRight } from "lucide-react";

const cards = [
  {
    icon: Mic2,
    title: "Accès Studio",
    text: "L'activation du Studio est gratuite. Elle permet de préparer vos émissions et épisodes. La publication dépend des droits de votre compte et de la disponibilité du service dans le pays choisi.",
    href: "/studio",
    cta: "Retour à mon Studio",
  },
  {
    icon: Clapperboard,
    title: "Services de production",
    text: "Les prestations d'enregistrement et d'accompagnement sont distinctes de votre accès au Studio en ligne.",
    href: "/tarifs",
    cta: "Consulter les offres de production",
  },
  {
    icon: Crown,
    title: "Abonnement auditeur",
    text: "Votre abonnement d'écoute ne certifie pas votre profil créateur et ne remplace pas l'activation Studio.",
    href: "/settings/subscription",
    cta: "Gérer mon abonnement d'écoute",
  },
];

export default function StudioPricingPage() {
  return (
    <div className="space-y-6 w-full pb-12">
      <div className="border-b border-[#222222] pb-5">
        <h1 className="text-2xl font-bold text-white">Offres & accès Studio</h1>
        <p className="text-sm text-[#888888] mt-1">Ce qui est inclus dans votre espace créateur et ce qui relève d'autres services.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.title} className="bg-[#111111] border border-[#222222] rounded-2xl p-6 flex flex-col gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#1C1C1C] border border-[#2A2A2A] flex items-center justify-center">
              <c.icon className="w-5 h-5 text-[#FFBF00]" />
            </div>
            <div className="space-y-2 flex-1">
              <h2 className="text-base font-bold text-white">{c.title}</h2>
              <p className="text-xs text-[#888888] leading-relaxed">{c.text}</p>
            </div>
            <Link href={c.href} className="inline-flex items-center gap-1 text-xs font-bold text-[#FFBF00] hover:underline">
              {c.cta} <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
