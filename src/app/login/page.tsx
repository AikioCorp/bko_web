"use client";
import { API_BASE_URL } from "@/lib/api";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "../../store/authStore";
import { LogIn, Lock, Mail, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

function LoginContent() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const { setAuth } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const json = await res.json();

      if (json.success) {
        setAuth(json.data.user, json.data.accessToken);
        router.push(redirect);
      } else {
        setError(json.error?.message || "Identifiants incorrects");
      }
    } catch (err) {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-8 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-[#E5A93C] rounded-xl flex items-center justify-center font-bold text-black text-2xl mx-auto shadow-lg">
            🎙️
          </div>
          <h1 className="text-2xl font-black text-white">Connexion</h1>
          <p className="text-xs text-gray-400">Accédez à vos podcasts suivis et à votre bibliothèque</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">Email ou Téléphone</label>
            <div className="relative">
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="votre.email@exemple.com"
                className="w-full bg-[#0A0D14] border border-[#1E2638] rounded-xl py-3 pl-10 pr-4 text-xs text-white outline-none focus:border-[#E5A93C]"
              />
              <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">Mot de passe</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
            <span>{loading ? "Connexion..." : "SE CONNECTER"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-4 border-t border-[#1E2638] text-xs text-gray-400">
          Pas encore de compte ?{" "}
          <a href="/register" className="text-[#E5A93C] font-bold hover:underline">
            S'inscrire gratuitement
          </a>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-gray-400">Chargement...</div>}>
      <LoginContent />
    </Suspense>
  );
}
