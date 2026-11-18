"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import {
  X,
  UserPlus,
  User,
  Mail,
  Phone,
  AtSign,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Shield,
  Crown,
  Sparkles,
  Radio,
  Users,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { ClientPortal } from "@/components/ui/ClientPortal";

const ROLE_INFO_MAP: Record<string, { label: string; badgeBg: string; badgeText: string; icon: any }> = {
  SUPER_ADMIN: {
    label: "Super Admin",
    badgeBg: "bg-[#2E2405] border border-[#FFBF00]/40",
    badgeText: "text-[#FFBF00]",
    icon: Crown,
  },
  ADMIN: {
    label: "Admin",
    badgeBg: "bg-[#0F223D] border border-[#3B82F6]/40",
    badgeText: "text-[#60A5FA]",
    icon: Shield,
  },
  EDITOR: {
    label: "Éditeur",
    badgeBg: "bg-[#0E2C2C] border border-[#14B8A6]/40",
    badgeText: "text-[#2DD4BF]",
    icon: Sparkles,
  },
  CREATOR: {
    label: "Créateur",
    badgeBg: "bg-[#27153E] border border-[#A855F7]/40",
    badgeText: "text-[#C084FC]",
    icon: Radio,
  },
  USER: {
    label: "Auditeur",
    badgeBg: "bg-[#1E1E1E] border border-[#333333]",
    badgeText: "text-[#AAAAAA]",
    icon: Users,
  },
};

interface AdminCreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (createdUser: any) => void;
}

export function AdminCreateUserModal({
  isOpen,
  onClose,
  onSuccess,
}: AdminCreateUserModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isVerified, setIsVerified] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["USER"]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: assignableRoles } = useSWR<any[]>(
    isOpen ? "/admin/assignable-roles" : null,
    (url: string) => adminApi(url).then((r) => r.data)
  );

  useEffect(() => {
    if (isOpen) {
      setFullName("");
      setEmail("");
      setUsername("");
      setPhoneNumber("");
      setPassword("");
      setShowPassword(false);
      setIsVerified(true);
      setSelectedRoles(["USER"]);
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleRole = (roleName: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleName)
        ? prev.length > 1
          ? prev.filter((r) => r !== roleName)
          : prev
        : [...prev, roleName]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage("Le nom complet est obligatoire.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Veuillez saisir une adresse e-mail valide.");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await adminApi("/admin/users", {
        method: "POST",
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
          username: username.trim() ? username.trim().toLowerCase() : null,
          phoneNumber: phoneNumber.trim() || null,
          isVerified,
          roles: selectedRoles,
        }),
      });
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || "Impossible de créer le compte utilisateur.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ClientPortal>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={onClose}
      >
        <div
          className="bg-[#0F0F0F] border border-[#262626] rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* En-tête */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#202020] bg-[#141414]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1F1800] border border-[#FFBF00]/40 flex items-center justify-center text-[#FFBF00]">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Créer un compte utilisateur</h2>
                <p className="text-xs text-[#888888]">
                  Compte directement opérationnel avec rôles et validation personnalisés.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-[#888888] hover:text-white hover:bg-[#1E1E1E] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Corps du formulaire */}
          <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-[#2A0E0E] border border-[#EF4444]/40 text-[#FCA5A5] text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#EF4444]" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nom complet */}
              <div>
                <label className="block text-xs font-semibold text-[#CCCCCC] mb-1.5">
                  Nom complet <span className="text-[#FFBF00]">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex: Apple Review"
                    className="w-full bg-[#161616] border border-[#282828] rounded-xl pl-9 pr-3 py-2.5 text-sm text-white outline-none focus:border-[#FFBF00] transition-colors placeholder:text-[#555555]"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-[#CCCCCC] mb-1.5">
                  Adresse e-mail <span className="text-[#FFBF00]">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nom@bamakopodcast.studio"
                    className="w-full bg-[#161616] border border-[#282828] rounded-xl pl-9 pr-3 py-2.5 text-sm text-white outline-none focus:border-[#FFBF00] transition-colors placeholder:text-[#555555]"
                  />
                </div>
              </div>

              {/* Identifiant (optionnel) */}
              <div>
                <label className="block text-xs font-semibold text-[#CCCCCC] mb-1.5">
                  Nom d&apos;utilisateur <span className="text-[#666666] font-normal">(optionnel)</span>
                </label>
                <div className="relative">
                  <AtSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="pseudo_unique"
                    className="w-full bg-[#161616] border border-[#282828] rounded-xl pl-9 pr-3 py-2.5 text-sm text-white outline-none focus:border-[#FFBF00] transition-colors placeholder:text-[#555555]"
                  />
                </div>
              </div>

              {/* Téléphone (optionnel) */}
              <div>
                <label className="block text-xs font-semibold text-[#CCCCCC] mb-1.5">
                  Téléphone <span className="text-[#666666] font-normal">(optionnel)</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+223 70 00 00 00"
                    className="w-full bg-[#161616] border border-[#282828] rounded-xl pl-9 pr-3 py-2.5 text-sm text-white outline-none focus:border-[#FFBF00] transition-colors placeholder:text-[#555555]"
                  />
                </div>
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-xs font-semibold text-[#CCCCCC] mb-1.5">
                Mot de passe initial <span className="text-[#FFBF00]">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 caractères"
                  className="w-full bg-[#161616] border border-[#282828] rounded-xl pl-9 pr-10 py-2.5 text-sm text-white outline-none focus:border-[#FFBF00] transition-colors placeholder:text-[#555555]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777777] hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Statut Vérifié */}
            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-[#141414] border border-[#242424] cursor-pointer hover:border-[#333333] transition-colors">
              <input
                type="checkbox"
                checked={isVerified}
                onChange={(e) => setIsVerified(e.target.checked)}
                className="mt-0.5 accent-[#FFBF00] w-4 h-4"
              />
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#1DB954]" />
                  Compte immédiatement vérifié (sans code OTP requis)
                </div>
                <p className="text-[11px] text-[#888888] mt-0.5">
                  Recommandé pour les comptes créés par l&apos;administration ou les comptes de test.
                </p>
              </div>
            </label>

            {/* Rôles */}
            <div>
              <label className="block text-xs font-semibold text-[#CCCCCC] mb-2">
                Rôles attribués
              </label>
              <div className="flex flex-wrap gap-2">
                {(assignableRoles || [{ name: "USER" }, { name: "CREATOR" }]).map((r: any) => {
                  const roleName = r.name || r;
                  const active = selectedRoles.includes(roleName);
                  const meta = ROLE_INFO_MAP[roleName] || {
                    label: roleName,
                    badgeBg: "bg-[#1C1C1C] border border-[#333333]",
                    badgeText: "text-[#DDDDDD]",
                    icon: Shield,
                  };
                  const Icon = meta.icon;
                  return (
                    <button
                      key={roleName}
                      type="button"
                      onClick={() => toggleRole(roleName)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        active
                          ? "bg-[#1F1800] border-[#FFBF00] text-[#FFBF00]"
                          : "bg-[#161616] border-[#282828] text-[#999999] hover:text-white"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {meta.label}
                      {active && <CheckCircle2 className="w-3.5 h-3.5 ml-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pied de modale */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#202020]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#181818] text-[#CCCCCC] hover:text-white border border-[#2A2A2A] transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-[#FFBF00] text-[#0B0B0B] hover:bg-[#FFD038] disabled:opacity-60 transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Créer le compte
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ClientPortal>
  );
}
