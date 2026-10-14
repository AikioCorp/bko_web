"use client";

import { useEffect, useState, ReactNode } from "react";
import { createPortal } from "react-dom";

interface ClientPortalProps {
  children: ReactNode;
  lockScroll?: boolean;
}

export function ClientPortal({ children, lockScroll = true }: ClientPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let originalOverflow = "";
    if (lockScroll && typeof document !== "undefined") {
      originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }

    return () => {
      if (lockScroll && typeof document !== "undefined") {
        document.body.style.overflow = originalOverflow;
      }
    };
  }, [lockScroll]);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(children, document.body);
}
