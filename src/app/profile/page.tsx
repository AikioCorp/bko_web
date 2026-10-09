"use client";
import { useAuthStore } from "../../store/authStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  User, Shield, Laptop, LogOut, Settings, Bell, 
  Library, Lock, LifeBuoy, FileText, ChevronRight, 
  Mic, Crown, CreditCard, PenLine, BadgeCheck 
} from "lucide-react";

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-16 h-16 bg-[#141414] border border-[#262626] rounded-2xl flex items-center justify-center mx-auto shadow-xl">
            <Shield className="w-6 h-6 text-[#757575]" />
          </div>
          <div className="space-y-2">
            <h1 className="text-white font-extrabold text-xl">Accès restreint</h1>
            <p className="text-[#888888] text-sm">Veuillez vous connecter pour accéder à votre profil.</p>
          </div>
          <Link href="/login" className="block w-full bg-white text-black font-bold py-3 rounded-xl text-sm transition-colors hover:bg-gray-200">
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  const isCreator = user.roles.includes("CREATOR");
  const isAdmin = user.roles.includes("ADMIN");

  const MenuRow = ({ href, icon: Icon, label, color = "text-white" }: { href: string, icon: any, label: string, color?: string }) => {
    const iconClass = "w-5 h-5 transition-colors " + (color === "text-white" ? "text-[#888888] group-hover:text-white" : color);
    const textClass = "text-sm font-semibold transition-colors " + color;
    
    return (
      <Link href={href} className="flex items-center justify-between p-4 hover:bg-[#1A1A1A] transition-colors group border-b border-[#262626] last:border-0">
        <div className="flex items-center gap-4">
          <Icon className={iconClass} />
          <span className={textClass}>{label}</span>
        </div>
        <ChevronRight className="w-4 h-4 text-[#444444] group-hover:text-white transition-colors" />
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white pb-12">
      {/* Header */}
      <header className="border-b border-[#262626] bg-[#0B0B0B]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-lg font-bold">Mon Profil</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        
        {/* Top Section : Avatar & Infos */}
        <section className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="w-24 h-24 bg-[#141414] border border-[#262626] rounded-full flex items-center justify-center font-black text-[#555555] text-3xl shadow-xl shrink-0 overflow-hidden">
            {user.avatar ? (
              <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
            ) : (
              <span className="uppercase">{user.fullName.charAt(0)}</span>
            )}
          </div>
          
          <div className="space-y-3 flex-1">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight flex items-center justify-center sm:justify-start gap-2">
                {user.fullName}
              </h2>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-sm text-[#888888] mt-1">
                <span>{user.email}</span>
                <BadgeCheck className="w-4 h-4 text-[#238636]" />
              </div>
            </div>
            
            <Link 
              href="/profile/personal-info" 
              className="inline-flex items-center justify-center gap-2 bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors"
            >
              <PenLine className="w-3.5 h-3.5" />
              Modifier mon profil
            </Link>
          </div>
        </section>

        {/* Group 1 : Mon expérience */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold text-[#888888] uppercase tracking-wider px-2">Mon expérience</h3>
          <div className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
            <MenuRow href="/library" icon={Library} label="Ma bibliothèque" />
            <MenuRow href="/profile/preferences" icon={Settings} label="Préférences" />
            <MenuRow href="/profile/notifications" icon={Bell} label="Notifications" />
          </div>
        </section>

        {/* Group 2 : Mon compte */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold text-[#888888] uppercase tracking-wider px-2">Mon compte</h3>
          <div className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
            <MenuRow href="/profile/personal-info" icon={User} label="Informations personnelles" />
            <MenuRow href="/profile/security" icon={Lock} label="Sécurité et appareils" />
            <MenuRow href="/profile/privacy" icon={Shield} label="Confidentialité et données" />
          </div>
        </section>

        {/* Group 3 : Espace Créateur */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold text-[#FFBF00] uppercase tracking-wider px-2">Studio & Création</h3>
          <div className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
            {isCreator ? (
              <>
                <MenuRow href="/studio" icon={Mic} label="Ouvrir mon studio" color="text-[#FFBF00]" />
                <MenuRow href="/studio/profile" icon={User} label="Mon profil créateur" />
                <MenuRow href="/studio/pricing" icon={CreditCard} label="Abonnement Studio" />
              </>
            ) : (
              <MenuRow href="/studio/onboarding" icon={Mic} label="Devenir créateur" color="text-[#FFBF00]" />
            )}
          </div>
        </section>

        {/* Group 4 : Administration (If Admin) */}
        {isAdmin && (
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider px-2">Administration</h3>
            <div className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
              <MenuRow href="/admin" icon={Crown} label="Console d'administration" color="text-red-500" />
            </div>
          </section>
        )}

        {/* Group 5 : Assistance */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold text-[#888888] uppercase tracking-wider px-2">Assistance</h3>
          <div className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
            <MenuRow href="/help" icon={LifeBuoy} label="Aide et assistance" />
            <MenuRow href="/terms" icon={FileText} label="Conditions d'utilisation" />
          </div>
        </section>

        {/* Déconnexion */}
        <div className="pt-4">
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="w-full flex items-center justify-center gap-2 bg-transparent hover:bg-[#1A1A1A] border border-[#262626] text-red-500 font-bold py-4 rounded-2xl text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Se déconnecter</span>
          </button>
        </div>

      </main>
    </div>
  );
}
