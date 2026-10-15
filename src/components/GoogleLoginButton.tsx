"use client";

import React, { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { API_BASE_URL } from "@/lib/api";

import { resolvePostAuthDecision } from "@/lib/auth-navigation";

interface GoogleLoginButtonProps {
  mode?: "login" | "register";
  onNavigating?: () => void;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ mode = "login", onNavigating }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const redirectTarget = searchParams.get("redirect") || "/";

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // credentialResponse contains credential (idToken)
      const idToken = credentialResponse?.credential || credentialResponse?.access_token;

      const res = await fetch(`${API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          idToken: credentialResponse.credential,
          deviceType: "WEB",
          deviceName: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 50) : "Navigateur Web",
        }),
      });

      const data = await res.json();

      if (data.success && data.data) {
        if (onNavigating) onNavigating();
        const { user: backendUser, accessToken, refreshToken } = data.data;
        const userObj = {
          ...backendUser,
          roles: backendUser.roles || ["USER"],
          permissions: backendUser.permissions || [],
        };

        setAuth(userObj as any, accessToken, refreshToken);
        const decision = resolvePostAuthDecision(userObj, redirectTarget);
        router.push(decision.path);
      } else {
        setErrorMsg(data.error?.message || "Échec de l'authentification avec Google");
      }
    } catch (err: any) {
      setErrorMsg("Impossible de contacter le serveur. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-2">
      {/* Séparateur élégant "OU" */}
      <div className="relative flex items-center justify-center my-4">
        <div className="border-t border-[#262626] w-full" />
        <span className="bg-[#121212] px-3 text-[11px] font-semibold tracking-wider text-[#757575] uppercase absolute">
          ou
        </span>
      </div>

      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 text-xs text-center">
          {errorMsg}
        </div>
      )}

      {/* Bouton personnalisé Google Brand (Zéro gradient, conforme charte) */}
      <div className="flex justify-center w-full">
        <CustomGoogleTrigger
          mode={mode}
          isLoading={isLoading}
          onSuccess={handleGoogleSuccess}
          onError={() => setErrorMsg("Connexion Google annulée ou indisponible.")}
        />
      </div>
    </div>
  );
};

function CustomGoogleTrigger({
  mode,
  isLoading,
  onSuccess,
  onError,
}: {
  mode: "login" | "register";
  isLoading: boolean;
  onSuccess: (res: any) => void;
  onError: () => void;
}) {
  const { GoogleLogin } = require("@react-oauth/google");

  return (
    <div className="w-full flex justify-center">
      <GoogleLogin
        onSuccess={onSuccess}
        onError={onError}
        theme="filled_black"
        shape="pill"
        size="large"
        width="100%"
        text={mode === "register" ? "signup_with" : "signin_with"}
        locale="fr"
      />
    </div>
  );
}
