"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login?tab=register");
  }, [router]);

  return (
    <div className="p-12 text-center text-[#757575] text-xs">
      Redirection vers l'inscription...
    </div>
  );
}

