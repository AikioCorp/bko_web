"use client";

import React from "react";

export const LoadingSkeleton = ({ count = 3 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-[#121722] border border-[#1E2638] rounded-xl p-5 space-y-4 animate-pulse"
        >
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-[#1E2638] rounded-lg"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-[#1E2638] rounded w-3/4"></div>
              <div className="h-3 bg-[#1E2638] rounded w-1/2"></div>
            </div>
          </div>
          <div className="h-3 bg-[#1E2638] rounded w-full"></div>
          <div className="h-3 bg-[#1E2638] rounded w-2/3"></div>
        </div>
      ))}
    </div>
  );
};
