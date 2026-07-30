import React from "react";
import Image from "next/image";
import Link from "next/link";

interface BkoLogoProps {
  variant?: "full" | "icon" | "compact";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const BkoLogo: React.FC<BkoLogoProps> = ({ variant = "full", size = "md", className = "" }) => {
  const heightMap = {
    sm: 28,
    md: 36,
    lg: 48,
  };

  const currentHeight = heightMap[size];

  if (variant === "icon") {
    return (
      <Link href="/" className={`inline-flex items-center gap-2 ${className}`} title="Bko Podcast">
        <Image
          src="/brand/favicon.png"
          alt="Bko Podcast Symbol"
          width={currentHeight}
          height={currentHeight}
          className="object-contain"
          priority
        />
      </Link>
    );
  }

  return (
    <Link href="/" className={`inline-flex items-center gap-3 group ${className}`} title="Bko Podcast">
      <Image
        src="/brand/logo.webp"
        alt="Bko Podcast Logo"
        width={currentHeight * 3.5}
        height={currentHeight}
        className="object-contain transition-transform group-hover:scale-[1.02]"
        priority
      />
    </Link>
  );
};
