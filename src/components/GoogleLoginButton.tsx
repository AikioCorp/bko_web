"use client";

import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { API_BASE_URL } from "@/lib/api";
import { resolvePostAuthDecision } from "@/lib/auth-navigation";

interface GoogleLoginButtonProps {
  mode?: "login" | "register";
  onNavigating?: () => void;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  mode = "login",
  onNavigating,
}) => {
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
      const idToken =
        credentialResponse?.credential || credentialResponse?.access_token;
      if (!idToken) {
        setErrorMsg("Jeton Google introuvable.");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          idToken,
          deviceType: "WEB",
          deviceName:
            typeof navigator !== "undefined"
              ? navigator.userAgent.slice(0, 50)
              : "Navigateur Web",
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
        setErrorMsg(
          data.error?.message || "Échec de l'authentification avec Google"
        );
      }
    } catch {
      setErrorMsg("Impossible de contacter le serveur. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const label =
    mode === "register" ? "S'inscrire avec Google" : "Continuer avec Google";

  return (
    <div className="w-full space-y-2">
      <div className="relative group w-full">
        <button
          type="button"
          disabled={isLoading}
          aria-label={label}
          className="h-[46px] w-full rounded-xl bg-[#161616] group-hover:bg-[#1F1F1F] disabled:opacity-60 border border-[#262626] group-hover:border-[#3A3A3A] text-white font-semibold text-xs sm:text-sm transition-all duration-150 group-active:scale-[0.97] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFBF00] flex items-center justify-center gap-2.5 px-4 cursor-pointer"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="w-5 h-5 shrink-0"
          >
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
            />
          </svg>
          <span>{isLoading ? "Connexion..." : "Google"}</span>
        </button>

        {!isLoading && (
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.001] z-10 overflow-hidden cursor-pointer flex items-center justify-center rounded-xl scale-110"
          >
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() =>
                setErrorMsg("Connexion Google annulée ou indisponible.")
              }
              theme="filled_black"
              shape="rectangular"
              size="large"
              width="360"
              text={mode === "register" ? "signup_with" : "signin_with"}
            />
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 text-xs text-center">
          {errorMsg}
        </div>
      )}
    </div>
  );
};
