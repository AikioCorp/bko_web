import Link from 'next/link';

export default function StudioPricingPage() {
  return <div className="max-w-2xl mx-auto p-6 space-y-6">
    <h1 className="text-2xl font-bold">Votre accès Studio</h1>
    <p className="text-gray-400">L’activation du Studio est gratuite. Elle permet de préparer vos émissions et épisodes. La publication dépend des droits de votre compte et de la disponibilité du service dans le pays choisi.</p>
    <div className="border-t border-[#28282B] pt-5 space-y-3">
      <h2 className="font-bold">Services de production</h2>
      <p className="text-gray-400">Les prestations d’enregistrement et d’accompagnement sont distinctes de votre accès au Studio en ligne.</p>
      <Link href="/tarifs" className="inline-block text-[#FFBF00]">Consulter les offres de production</Link>
    </div>
    <div className="border-t border-[#28282B] pt-5 space-y-3">
      <h2 className="font-bold">Abonnement auditeur</h2>
      <p className="text-gray-400">Votre abonnement d’écoute ne certifie pas votre profil créateur et ne remplace pas l’activation Studio.</p>
      <Link href="/settings/subscription" className="inline-block text-[#FFBF00]">Gérer mon abonnement d’écoute</Link>
    </div>
    <Link href="/studio" className="inline-block text-[#FFBF00]">Retour à mon Studio</Link>
  </div>;
}
