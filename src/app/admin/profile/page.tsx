"use client";

import React from "react";
import { UnifiedProfileView } from "@/components/profile/UnifiedProfileView";

export default function AdminProfilePage() {
  return (
    <div className="w-full px-4 py-6">
      <UnifiedProfileView portalContext="admin" />
    </div>
  );
}
