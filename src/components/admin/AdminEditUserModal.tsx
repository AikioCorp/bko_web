"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  AtSign,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Save,
} from "lucide-react";
import { adminApi } from "@/lib/api";

interface AdminEditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    fullName?: string | null;
    email: string;
    username?: string | null;
    phoneNumber?: string | null;
    isVerified?: boolean;
    isEmailVerified?: boolean;
    avatar?: string | null;
  } | null;
  onSuccess: (updatedUser: any) => void;
}

export function AdminEditUserModal({
  isOpen,
  onClose,
  user,
  onSuccess,
}: AdminEditUserModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user && isOpen) {
      setFullName(user.fullName || "");
      setEmail(user.email || "");
      setUsername(user.username || "");
      setPhoneNumber(user.phoneNumber || "");
      setIsVerified(Boolean(user.isVerified ?? user.isEmailVerified));
      setErrorMessage(null);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMessage("Le nom complet est obligatoire.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Veuillez saisir une adresse email valide.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const res = await adminApi(`/admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          username: username.trim() || null,
          phoneNumber: phoneNumber.trim() || null,
          isVerified,
        }),
      });

      if (res.data) {
        onSuccess(res.data);
        onClose();
      }
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("EMAIL_ALREADY_EXISTS")) {
        setErrorMessage("Cette adresse email est déjà attribuée à un autre compte.");
      } else if (msg.includes("PHONE_ALREADY_EXISTS")) {
        setErrorMessage("Ce numéro de téléphone est déjà associé à un autre compte.");
      } else if (msg.includes("USERNAME_ALREADY_EXISTS")) {
        setErrorMessage("Cet identifiant (@username) est déjà réservé.");
      } else if (msg.includes("SUPER_ADMIN_REQUIRED")) {
        setErrorMessage("Action réservée aux Super Administrateurs de la plateforme.");
      } else {
        setErrorMessage(msg || "Une erreur est survenue lors de la mise à jour.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#141414] border border-[#262626] rounded-2xl shadow-2xl text-white overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#222222] bg-[#111111]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#221A05] border border-[#FFBF00]/40 flex items-center justify-center text-[#FFBF00]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Modifier l&apos;utilisateur</h2>
              <p className="text-xs text-[#888888] font-mono">ID: {user.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#777777] hover:text-white rounded-lg hover:bg-[#1F1F1F] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message d'erreur */}
        {errorMessage && (
          <div className="mx-6 mt-5 p-3.5 rounded-xl bg-[#251012] border border-red-900/50 flex items-start gap-2.5 text-xs text-red-300">
            <AlertTriangle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nom complet */}
          <div>
            <label className="block text-xs font-semibold text-[#AAAAAA] uppercase tracking-wider mb-1.5">
              Nom complet *
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666666]" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="ex. Mamadou Diarra"
                required
                className="w-full bg-[#0D0D0D] border border-[#242424] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#555555] outline-none focus:border-[#FFBF00] transition-colors"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-[#AAAAAA] uppercase tracking-wider mb-1.5">
              Adresse email *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666666]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="adresse@domaine.com"
                required
                className="w-full bg-[#0D0D0D] border border-[#242424] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#555555] outline-none focus:border-[#FFBF00] transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-[#AAAAAA] uppercase tracking-wider mb-1.5">
                Nom d&apos;utilisateur
              </label>
              <div className="relative">
                <AtSign className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666666]" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="nom_utilisateur"
                  className="w-full bg-[#0D0D0D] border border-[#242424] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#555555] outline-none focus:border-[#FFBF00] transition-colors"
                />
              </div>
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-xs font-semibold text-[#AAAAAA] uppercase tracking-wider mb-1.5">
                Téléphone
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666666]" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+223 ..."
                  className="w-full bg-[#0D0D0D] border border-[#242424] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#555555] outline-none focus:border-[#FFBF00] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Toggle Compte Vérifié */}
          <div className="p-3.5 rounded-xl bg-[#171717] border border-[#242424] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">Statut du compte vérifié</div>
                <div className="text-[11px] text-[#888888]">
                  Valide l&apos;adresse email et active les privilèges auditeur complets.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsVerified(!isVerified)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isVerified ? "bg-[#1DB954]" : "bg-[#2E2E2E]"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isVerified ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222222]">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-[#1C1C1C] hover:bg-[#282828] text-white text-xs font-semibold border border-[#333333] transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-[#FFBF00] hover:bg-[#E5AB00] text-black text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Enregistrer les modifications</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
