"use client";
import { API_BASE_URL } from "@/lib/api";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, Phone, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phoneNumber, password }),
      });
      const json = await res.json();

      if (json.success) {
        // Le compte est créé mais non vérifié : passage par l'étape OTP.
        router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
      } else {
        setError(json.error?.message || "Erreur lors de l'inscription");
      }
    } catch (err) {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-8 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black text-white">Créer un compte</h1>
          <p className="text-xs text-gray-400">Rejoignez Bamako Podcast et personnalisez votre écoute</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">Nom complet</label>
            <div className="relative">
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: Mohamed Traoré"
                className="w-full bg-[#0A0D14] border border-[#1E2638] rounded-xl py-3 pl-10 pr-4 text-xs text-white outline-none focus:border-[#E5A93C]"
              />
              <User className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">Email</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@exemple.com"
                className="w-full bg-[#0A0D14] border border-[#1E2638] rounded-xl py-3 pl-10 pr-4 text-xs text-white outline-none focus:border-[#E5A93C]"
              />
              <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">Téléphone (optionnel)</label>
            <div className="relative">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+223 70 00 00 00"
                className="w-full bg-[#0A0D14] border border-[#1E2638] rounded-xl py-3 pl-10 pr-4 text-xs text-white outline-none focus:border-[#E5A93C]"
              />
              <Phone className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">Mot de passe</label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 caractères"
                className="w-full bg-[#0A0D14] border border-[#1E2638] rounded-xl py-3 pl-10 pr-4 text-xs text-white outline-none focus:border-[#E5A93C]"
              />
              <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E5A93C] text-black font-extrabold py-3 rounded-xl text-xs hover:bg-[#F5B82E] transition shadow-lg flex items-center justify-center space-x-2"
          >
            <span>{loading ? "Création du compte..." : "S'INSCRIRE"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-4 border-t border-[#1E2638] text-xs text-gray-400">
          Déjà un compte ?{" "}
          <a href="/login" className="text-[#E5A93C] font-bold hover:underline">
            Se connecter
          </a>
        </div>
      </div>
    </div>
  );
}
