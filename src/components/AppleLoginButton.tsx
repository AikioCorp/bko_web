"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { API_BASE_URL } from "@/lib/api";
import { resolvePostAuthDecision } from "@/lib/auth-navigation";

interface AppleAuthInitConfig {
  clientId: string;
  scope: string;
  redirectURI: string;
  state?: string;
  usePopup: boolean;
}

interface AppleSignInResponse {
  authorization?: {
    id_token?: string;
    code?: string;
    state?: string;
  };
  user?: {
    email?: string;
    name?: {
      firstName?: string;
      lastName?: string;
    };
  };
}

declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (config: AppleAuthInitConfig) => void;
        signIn: () => Promise<AppleSignInResponse>;
      };
    };
  }
}

interface AppleLoginButtonProps {
  mode?: "login" | "register";
  onNavigating?: () => void;
}

const APPLE_SDK_SRC =
  "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";

let appleSdkLoadPromise: Promise<void> | null = null;

function loadAppleSignInSdk(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Apple Sign In est uniquement disponible dans un navigateur."));
  }
  if (window.AppleID?.auth) {
    return Promise.resolve();
  }
  if (appleSdkLoadPromise) {
    return appleSdkLoadPromise;
  }

  appleSdkLoadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${APPLE_SDK_SRC}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => {
          appleSdkLoadPromise = null;
          reject(new Error("Impossible de charger le SDK Apple Sign In."));
        },
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = APPLE_SDK_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      appleSdkLoadPromise = null;
      reject(new Error("Impossible de charger le SDK Apple Sign In."));
    };
    document.head.appendChild(script);
  });

  return appleSdkLoadPromise;
}

export const AppleLoginButton: React.FC<AppleLoginButtonProps> = ({
  mode = "login",
  onNavigating,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const redirectTarget = searchParams.get("redirect") || "/";

  const handleAppleSignIn = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      await loadAppleSignInSdk();
      if (!window.AppleID?.auth) {
        throw new Error("SDK Apple indisponible sur ce navigateur.");
      }

      const clientId =
        process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || "studio.bamakopodcast.web";
      const redirectURI =
        process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI ||
        (typeof window !== "undefined"
          ? `${window.location.origin}/login`
          : "https://bamakopodcast.studio/login");

      const stateToken =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      window.AppleID.auth.init({
        clientId,
        scope: "name email",
        redirectURI,
        state: stateToken,
        usePopup: true,
      });

      const appleRes = await window.AppleID.auth.signIn();
      const identityToken = appleRes?.authorization?.id_token;
      if (!identityToken) {
        throw new Error("Jeton d'identité Apple introuvable.");
      }

      const firstName = appleRes?.user?.name?.firstName?.trim() || "";
      const lastName = appleRes?.user?.name?.lastName?.trim() || "";
      const fullName = [firstName, lastName].filter(Boolean).join(" ") || null;

      const res = await fetch(`${API_BASE_URL}/auth/apple`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          identityToken,
          authorizationCode: appleRes?.authorization?.code,
          email: appleRes?.user?.email || null,
          fullName,
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
          data.error?.message || "Échec de l'authentification avec Apple."
        );
      }
    } catch (err: any) {
      const code = String(err?.error || err?.code || "").toLowerCase();
      if (
        code === "popup_closed_by_user" ||
        code === "user_cancelled_authorize"
      ) {
        return;
      }
      if (code === "invalid_client") {
        setErrorMsg(
          "Sign in with Apple Web n'est pas encore configuré pour ce domaine (Service ID Apple requis)."
        );
        return;
      }
      setErrorMsg(
        err?.message || "Connexion Apple annulée ou indisponible pour le moment."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const label =
    mode === "register" ? "S'inscrire avec Apple" : "Continuer avec Apple";

  return (
    <div className="w-full space-y-2">
      <button
        type="button"
        onClick={handleAppleSignIn}
        disabled={isLoading}
        aria-label={label}
        className="h-[46px] w-full rounded-xl bg-[#161616] hover:bg-[#1F1F1F] disabled:opacity-60 border border-[#262626] hover:border-[#3A3A3A] text-white font-semibold text-xs sm:text-sm transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFBF00] flex items-center justify-center gap-2.5 px-4 cursor-pointer"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="w-5 h-5 shrink-0 fill-current text-white"
        >
          <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z" />
        </svg>
        <span>{isLoading ? "Connexion..." : "Apple"}</span>
      </button>

      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 text-xs text-center">
          {errorMsg}
        </div>
      )}
    </div>
  );
};
