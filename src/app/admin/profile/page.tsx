"use client";
import { getAccessToken } from "@/lib/token";
import { API_BASE_URL } from "@/lib/api";

import React, { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { User, Shield, Laptop, LogOut, Save } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [msg, setMsg] = useState("");

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <p className="text-gray-400 text-sm">Veuillez vous connecter pour accéder à votre profil.</p>
        <a href="/login" className="inline-block bg-[#E5A93C] text-black px-6 py-2.5 rounded-full font-bold text-xs">
          SE CONNECTER
        </a>
      </div>
    );
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    const token = getAccessToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fullName, avatar }),
      });
      const json = await res.json();
      if (json.success) {
        setMsg("Profil mis à jour avec succès !");
      }
    } catch (e) {
      setMsg("Erreur lors de la mise à jour");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-8 space-y-6">
        <div className="flex items-center space-x-4 border-b border-[#1E2638] pb-6">
          <div className="w-16 h-16 bg-[#E5A93C] rounded-full flex items-center justify-center font-black text-black text-2xl">
            {user.fullName[0]}
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">{user.fullName}</h1>
            <p className="text-xs text-gray-400">{user.email}</p>
            <div className="flex items-center space-x-2 mt-2">
              {user.roles.map((r) => (
                <span key={r} className="bg-[#E5A93C]/10 text-[#E5A93C] border border-[#E5A93C]/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>

        {msg && <div className="bg-[#E5A93C]/10 text-[#E5A93C] p-3 rounded-xl text-xs font-bold text-center">{msg}</div>}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">Nom complet</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-[#0A0D14] border border-[#1E2638] rounded-xl py-3 px-4 text-xs text-white outline-none focus:border-[#E5A93C]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">URL Avatar (Photo de profil)</label>
            <input
              type="text"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://..."
              className="w-full bg-[#0A0D14] border border-[#1E2638] rounded-xl py-3 px-4 text-xs text-white outline-none focus:border-[#E5A93C]"
            />
          </div>

          <div className="flex justify-between items-center pt-4">
            <a
              href="/settings/devices"
              className="text-xs text-gray-400 hover:text-[#E5A93C] flex items-center space-x-1"
            >
              <Laptop className="w-4 h-4" />
              <span>Gérer mes appareils</span>
            </a>

            <button
              type="submit"
              className="bg-[#E5A93C] text-black font-extrabold px-6 py-2.5 rounded-full text-xs hover:bg-[#F5B82E] transition flex items-center space-x-1.5 shadow"
            >
              <Save className="w-4 h-4" />
              <span>ENREGISTRER</span>
            </button>
          </div>
        </form>

        <div className="pt-6 border-t border-[#1E2638]">
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="w-full bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 py-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>SE DÉCONNECTER</span>
          </button>
        </div>
      </div>
    </div>
  );
}
