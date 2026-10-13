"use client";

import React from "react";
import { UnifiedProfileView } from "@/components/profile/UnifiedProfileView";

export default function StudioProfilePage() {
  return (
    <div className="w-full px-4 py-6 overflow-y-auto max-h-[calc(100vh-64px)]">
      <UnifiedProfileView portalContext="studio" />
    </div>
  );
}
