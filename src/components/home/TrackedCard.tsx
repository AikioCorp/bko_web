"use client";

import React, { useEffect, useRef } from "react";
import { recordRecommendationImpression } from "@/lib/playTracking";

interface TrackedCardProps {
  batchId?: string;
  sectionId?: string;
  sectionSlug?: string;
  targetType: "EPISODE" | "PODCAST";
  targetId: string;
  position: number;
  reason?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function TrackedCard({
  batchId,
  sectionId,
  sectionSlug,
  targetType,
  targetId,
  position,
  reason,
  children,
  className = "",
  onClick,
}: TrackedCardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const reportedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!batchId || !sectionId || reportedRef.current) return;

    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          // Commencer à chronométrer 1 seconde d'exposition continue
          if (!timerRef.current && !reportedRef.current) {
            timerRef.current = setTimeout(() => {
              if (!reportedRef.current) {
                reportedRef.current = true;
                recordRecommendationImpression(
                  batchId,
                  sectionId,
                  sectionSlug || "unknown",
                  targetType,
                  targetId,
                  position,
                  reason
                );
              }
            }, 1000);
          }
        } else {
          // Si l'utilisateur a scrollé avant 1 seconde continue, annuler le chronométrage
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [batchId, sectionId, sectionSlug, targetType, targetId, position, reason]);

  return (
    <div ref={containerRef} className={className} onClick={onClick}>
      {children}
    </div>
  );
}
