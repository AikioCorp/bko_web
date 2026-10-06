import sys

file_path = r'c:\Dev\Projet\bamako-Podcast\bko_web\src\app\become-creator\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('import React from "react";', 'import React, { useState } from "react";\nimport { useAuthStore } from "@/store/authStore";\nimport { useRouter } from "next/navigation";')

replacement_func = '''export default function BecomeCreatorPage() {
  const { user, isAuthenticated, setAuth } = useAuthStore();
  const router = useRouter();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      if (user && !(user.roles || []).includes("CREATOR")) {
        const updatedUser = { ...user, roles: [...(user.roles || []), "CREATOR"] };
        setAuth(updatedUser, useAuthStore.getState().accessToken, useAuthStore.getState().refreshToken);
      }
      router.push("/studio");
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpgrading(false);
    }
  };

  return ('''

content = content.replace('export default function BecomeCreatorPage() {\n  return (', replacement_func)

cta_unauth = '<Link href="/login" className="px-8 py-3.5 rounded-full bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-extrabold text-sm flex items-center gap-2 transition-all shadow-md active:scale-95 w-full sm:w-auto justify-center">Créer mon podcast gratuitement<ArrowRight className="w-4 h-4" /></Link>'
cta_auth = '<button onClick={handleUpgrade} disabled={isUpgrading} className="px-8 py-3.5 rounded-full bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-extrabold text-sm flex items-center gap-2 transition-all shadow-md active:scale-95 w-full sm:w-auto justify-center">{isUpgrading ? "Activation..." : "Activer mon espace Studio"}<ArrowRight className="w-4 h-4" /></button>'

target_link_1 = '<Link href="/login" className="px-8 py-3.5 rounded-full bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-extrabold text-sm flex items-center gap-2 transition-all shadow-md active:scale-95 w-full sm:w-auto justify-center">\n            Créer mon podcast gratuitement\n            <ArrowRight className="w-4 h-4" />\n          </Link>'
content = content.replace(target_link_1, f'{{isAuthenticated ? {cta_auth} : {cta_unauth}}}')

target_link_2 = '<Link href="/login" className="inline-flex px-10 py-4 rounded-full bg-[#0B0B0B] text-white hover:bg-[#1A1A1A] hover:scale-105 font-extrabold text-sm transition-all shadow-xl active:scale-95">\n            Créer mon compte créateur\n          </Link>'
content = content.replace(target_link_2, '{isAuthenticated ? <button onClick={handleUpgrade} disabled={isUpgrading} className="inline-flex px-10 py-4 rounded-full bg-[#0B0B0B] text-white hover:bg-[#1A1A1A] hover:scale-105 font-extrabold text-sm transition-all shadow-xl active:scale-95">{isUpgrading ? "Activation..." : "Activer mon Studio maintenant"}</button> : <Link href="/login" className="inline-flex px-10 py-4 rounded-full bg-[#0B0B0B] text-white hover:bg-[#1A1A1A] hover:scale-105 font-extrabold text-sm transition-all shadow-xl active:scale-95">Créer mon compte créateur</Link>}')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
