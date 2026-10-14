"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  KeyRound,
  Mail,
  Sparkles,
  Edit3,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  LogOut,
  Bell,
  ArrowRight,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { ClientPortal } from "@/components/ui/ClientPortal";

interface AdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    fullName?: string | null;
    email: string;
    username?: string | null;
    avatar?: string | null;
  } | null;
  onSuccess?: (result: any) => void;
}

type Mode = "SEND_EMAIL" | "GENERATE" | "DIRECT";

function generateSecurePassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*";
  let pwd = "";
  for (let i = 0; i < 12; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    pwd += chars.charAt(randomIndex);
  }
  return `Bko#${pwd}`;
}

export function AdminPasswordModal({
  isOpen,
  onClose,
  user,
  onSuccess,
}: AdminPasswordModalProps) {
  const [mode, setMode] = useState<Mode>("SEND_EMAIL");
  const [generatedPreview, setGeneratedPreview] = useState("");
  const [directPassword, setDirectPassword] = useState("");
  const [showDirectPassword, setShowDirectPassword] = useState(false);
  const [revokeSessions, setRevokeSessions] = useState(true);
  const [notifyUser, setNotifyUser] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    mode: Mode;
    message: string;
    generatedPassword?: string;
  } | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode("SEND_EMAIL");
      setGeneratedPreview(generateSecurePassword());
      setDirectPassword("");
      setShowDirectPassword(false);
      setRevokeSessions(true);
      setNotifyUser(true);
      setErrorMessage(null);
      setSuccessData(null);
      setCopiedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  const handleRegenerate = () => {
    setGeneratedPreview(generateSecurePassword());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (mode === "DIRECT") {
      if (!directPassword || directPassword.length < 8) {
        setErrorMessage("Le mot de passe doit comporter au moins 8 caractères.");
        return;
      }
    }

    try {
      setIsLoading(true);
      const payload: any = {
        mode,
        revokeSessions,
        notifyUser,
      };

      if (mode === "DIRECT") {
        payload.password = directPassword;
      }

      const res = await adminApi(`/admin/users/${user.id}/reset-password`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.data) {
        setSuccessData({
          mode,
          message: res.data.message || "Opération effectuée avec succès.",
          generatedPassword: res.data.generatedPassword || (mode === "GENERATE" ? generatedPreview : undefined),
        });
        if (onSuccess) onSuccess(res.data);
      }
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("USER_NOT_FOUND")) {
        setErrorMessage("Utilisateur introuvable.");
      } else if (msg.includes("SUPER_ADMIN_REQUIRED")) {
        setErrorMessage("Action réservée aux Super Administrateurs de la plateforme.");
      } else {
        setErrorMessage(msg || "Erreur lors de la réinitialisation du mot de passe.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ClientPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#141414] border border-[#262626] rounded-2xl shadow-2xl text-white overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#222222] bg-[#111111]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#221A05] border border-[#FFBF00]/40 flex items-center justify-center text-[#FFBF00]">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Réinitialisation & Mot de passe</h2>
              <p className="text-xs text-[#888888] truncate max-w-[280px]">
                {user.fullName || "Utilisateur"} • <span className="font-mono">{user.email}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#777777] hover:text-white rounded-lg hover:bg-[#1F1F1F] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Écran de Succès */}
        {successData ? (
          <div className="p-6 space-y-5">
            <div className="p-4 rounded-xl bg-[#0F2416] border border-emerald-900/60 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#1DB954] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-white">Réinitialisation validée</h3>
                <p className="text-xs text-emerald-300/90 mt-1">{successData.message}</p>
              </div>
            </div>

            {successData.generatedPassword && (
              <div className="p-5 rounded-xl bg-[#181818] border border-[#2A2A2A] space-y-3">
                <div className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-wider">
                  Nouveau mot de passe généré :
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#0E0E0E] border border-[#333333]">
                  <span className="font-mono text-base font-bold text-[#FFBF00] tracking-wider select-all">
                    {successData.generatedPassword}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(successData.generatedPassword!)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#242424] hover:bg-[#303030] text-xs font-semibold text-white transition-colors border border-[#3A3A3A]"
                  >
                    {copiedSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#1DB954]" />
                        <span className="text-[#1DB954]">Copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copier</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-[#888888] leading-relaxed">
                  ⚠️ <strong>Sécurité :</strong> Transmettez ce mot de passe à l&apos;utilisateur via un canal de communication sécurisé. Il lui sera conseillé de le modifier lors de sa première connexion.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-[#FFBF00] hover:bg-[#E5AB00] text-black text-xs font-bold transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          /* Formulaire de configuration */
          <form onSubmit={handleSubmit}>
            {/* Erreur */}
            {errorMessage && (
              <div className="mx-6 mt-5 p-3.5 rounded-xl bg-[#251012] border border-red-900/50 flex items-start gap-2.5 text-xs text-red-300">
                <AlertTriangle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Sélecteur d'onglets (3 Modes) */}
            <div className="p-6 pb-2">
              <label className="block text-xs font-semibold text-[#888888] uppercase tracking-wider mb-2">
                Sélectionnez une méthode de réinitialisation
              </label>

              <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-[#0F0F0F] border border-[#242424]">
                <button
                  type="button"
                  onClick={() => setMode("SEND_EMAIL")}
                  className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-colors flex flex-col items-center gap-1 text-center ${
                    mode === "SEND_EMAIL"
                      ? "bg-[#242424] text-white shadow-sm"
                      : "text-[#888888] hover:text-white"
                  }`}
                >
                  <Mail className="w-4 h-4 text-[#FFBF00]" />
                  <span>Envoyer OTP</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode("GENERATE")}
                  className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-colors flex flex-col items-center gap-1 text-center ${
                    mode === "GENERATE"
                      ? "bg-[#242424] text-white shadow-sm"
                      : "text-[#888888] hover:text-white"
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-[#3B82F6]" />
                  <span>Générer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode("DIRECT")}
                  className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-colors flex flex-col items-center gap-1 text-center ${
                    mode === "DIRECT"
                      ? "bg-[#242424] text-white shadow-sm"
                      : "text-[#888888] hover:text-white"
                  }`}
                >
                  <Edit3 className="w-4 h-4 text-[#1DB954]" />
                  <span>Manuel</span>
                </button>
              </div>
            </div>

            {/* Contenu spécifique par Mode */}
            <div className="px-6 py-3 space-y-4">
              {/* MODE 1: SEND_EMAIL */}
              {mode === "SEND_EMAIL" && (
                <div className="p-4 rounded-xl bg-[#171717] border border-[#262626] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-[#FFBF00]" />
                      Code OTP par Email
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#2E2405] text-[#FFBF00] border border-[#FFBF00]/30">
                      Recommandé
                    </span>
                  </div>
                  <p className="text-xs text-[#AAAAAA] leading-relaxed">
                    Un code de sécurité à 6 chiffres valable 15 minutes sera expédié à <strong>{user.email}</strong>. L&apos;utilisateur pourra définir lui-même son nouveau mot de passe en toute confidentialité depuis la page &quot;Mot de passe oublié&quot;.
                  </p>
                </div>
              )}

              {/* MODE 2: GENERATE */}
              {mode === "GENERATE" && (
                <div className="p-4 rounded-xl bg-[#171717] border border-[#262626] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#3B82F6]" />
                      Mot de passe fort automatique
                    </span>
                    <button
                      type="button"
                      onClick={handleRegenerate}
                      className="text-[11px] font-semibold text-[#888888] hover:text-white flex items-center gap-1 transition-colors"
                      title="Générer une autre combinaison"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Régénérer</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-[#0E0E0E] border border-[#303030]">
                    <span className="font-mono text-sm font-bold text-[#FFBF00] tracking-wider select-all">
                      {generatedPreview}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(generatedPreview)}
                      className="text-xs text-[#888888] hover:text-white p-1 rounded transition-colors"
                      title="Copier la prévisualisation"
                    >
                      {copiedSuccess ? (
                        <Check className="w-4 h-4 text-[#1DB954]" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-[#888888]">
                    Ce mot de passe sera immédiatement enregistré et haché avec bcrypt dans la base.
                  </p>
                </div>
              )}

              {/* MODE 3: DIRECT */}
              {mode === "DIRECT" && (
                <div className="p-4 rounded-xl bg-[#171717] border border-[#262626] space-y-3">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-[#1DB954]" />
                    Définir le mot de passe manuellement
                  </span>

                  <div className="relative">
                    <input
                      type={showDirectPassword ? "text" : "password"}
                      value={directPassword}
                      onChange={(e) => setDirectPassword(e.target.value)}
                      placeholder="Nouveau mot de passe (min. 8 caractères)..."
                      required
                      className="w-full bg-[#0E0E0E] border border-[#303030] rounded-xl px-3.5 py-2.5 pr-10 text-sm text-white placeholder:text-[#555555] outline-none focus:border-[#FFBF00] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDirectPassword(!showDirectPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777777] hover:text-white"
                    >
                      {showDirectPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {directPassword && directPassword.length < 8 && (
                    <div className="text-[11px] text-[#EF4444]">
                      Le mot de passe doit comporter au moins 8 caractères.
                    </div>
                  )}
                </div>
              )}

              {/* Options de Sécurité Transversales */}
              <div className="space-y-2.5 pt-2 border-t border-[#222222]">
                <div className="text-xs font-semibold text-[#888888] uppercase tracking-wider">
                  Options de sécurité
                </div>

                {/* Revoke Sessions */}
                <label className="flex items-start gap-3 p-3 rounded-xl bg-[#131313] border border-[#222222] hover:bg-[#181818] cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={revokeSessions}
                    onChange={(e) => setRevokeSessions(e.target.checked)}
                    className="w-4 h-4 rounded bg-[#202020] border-[#383838] text-[#FFBF00] focus:ring-[#FFBF00] mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <LogOut className="w-3.5 h-3.5 text-[#EF4444]" />
                      Révoquer immédiatement toutes les sessions actives
                    </div>
                    <p className="text-[11px] text-[#777777] mt-0.5">
                      Déconnecte immédiatement l&apos;utilisateur sur tous ses téléphones, tablettes et navigateurs web.
                    </p>
                  </div>
                </label>

                {/* Notify User */}
                {mode !== "SEND_EMAIL" && (
                  <label className="flex items-start gap-3 p-3 rounded-xl bg-[#131313] border border-[#222222] hover:bg-[#181818] cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={notifyUser}
                      onChange={(e) => setNotifyUser(e.target.checked)}
                      className="w-4 h-4 rounded bg-[#202020] border-[#383838] text-[#FFBF00] focus:ring-[#FFBF00] mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-blue-400" />
                        Notifier l&apos;utilisateur par notification push &amp; in-app
                      </div>
                      <p className="text-[11px] text-[#777777] mt-0.5">
                        Informe le compte qu&apos;une réinitialisation administrative a eu lieu.
                      </p>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#111111] border-t border-[#222222]">
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
                    <span>Traitement en cours...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {mode === "SEND_EMAIL"
                        ? "Envoyer le code OTP"
                        : mode === "GENERATE"
                        ? "Appliquer le mot de passe généré"
                        : "Enregistrer le mot de passe"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
    </ClientPortal>
  );
}
