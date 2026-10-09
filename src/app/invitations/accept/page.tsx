"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { studioApi } from "@/lib/studioApi";
import { useAuthStore } from "@/store/authStore";
import { Btn, Card } from "@/components/admin/ui";

function AcceptInner() {
  const token = useSearchParams()?.get("token") ?? "";
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [podcastId, setPodcastId] = useState("");

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const accept = async () => {
    setState("busy");
    try {
      const r = await studioApi<{ podcastId: string }>("/invitations/accept", { method: "POST", body: { token } });
      setPodcastId(r.podcastId);
      setState("done");
    } catch (e: any) {
      setMessage(e.message);
      setState("error");
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <Card className="p-8 space-y-4 text-center">
        <h1 className="text-xl font-extrabold text-white">Invitation Ã  rejoindre une Ã©quipe</h1>
        {!token && <p className="text-sm text-red-300">Lien d&apos;invitation incomplet.</p>}
        {token && isLoading && <p className="text-sm text-gray-400">Chargementâ€¦</p>}
        {token && !isLoading && !isAuthenticated && (
          <>
            <p className="text-sm text-gray-400">Connectez-vous avec l&apos;adresse email qui a reÃ§u l&apos;invitation.</p>
            <Link href={`/login?redirect=${encodeURIComponent(`/invitations/accept?token=${token}`)}`}>
              <Btn variant="primary">Se connecter</Btn>
            </Link>
          </>
        )}
        {token && !isLoading && isAuthenticated && state !== "done" && (
          <>
            <p className="text-sm text-gray-400">Acceptez pour rejoindre l&apos;Ã©quipe du podcast avec le rÃ´le prÃ©vu.</p>
            {state === "error" && <p className="text-sm text-red-300">{message}</p>}
            <Btn variant="primary" disabled={state === "busy"} onClick={accept}>
              {state === "busy" ? "â€¦" : "Accepter l'invitation"}
            </Btn>
          </>
        )}
        {state === "done" && (
          <>
            <p className="text-sm text-emerald-400">Vous faites maintenant partie de l&apos;Ã©quipe.</p>
            <Link href={`/studio/podcasts/${podcastId}`}>
              <Btn variant="primary">Ouvrir le podcast</Btn>
            </Link>
          </>
        )}
      </Card>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={null}>
      <AcceptInner />
    </Suspense>
  );
}

