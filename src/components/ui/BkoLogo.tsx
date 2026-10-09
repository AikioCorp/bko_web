import React from "react";
import Image from "next/image";
import Link from "next/link";

interface BkoLogoProps {
  variant?: "full" | "icon" | "compact";
  size?: "sm" | "md" | "lg";
  className?: string;
  showText?: boolean;
}

export const BkoLogo: React.FC<BkoLogoProps> = ({
  variant = "full",
  size = "md",
  className = "",
  showText = true,
}) => {
  const iconDimensions = {
    sm: { width: 32, height: 32, text: "text-base", sub: "text-[10px]" },
    md: { width: 40, height: 40, text: "text-lg", sub: "text-xs" },
    lg: { width: 48, height: 48, text: "text-xl", sub: "text-sm" },
  };

  const dim = iconDimensions[size];

  if (variant === "icon") {
    return (
      <Link href="/" className={`inline-flex items-center ${className}`} title="Bamako Podcast">
        <div className="relative rounded-lg overflow-hidden shrink-0" style={{ width: dim.width, height: dim.height }}>
          <Image
            src="/brand/app-icon.png"
            alt="Bamako Podcast"
            width={dim.width}
            height={dim.height}
            className="object-contain"
            priority
          />
        </div>
      </Link>
    );
  }

  return (
    <Link href="/" className={`inline-flex items-center gap-3 group select-none ${className}`} title="Bamako Podcast">
      <div className="relative rounded-lg overflow-hidden shrink-0" style={{ width: dim.width, height: dim.height }}>
        <Image
          src="/brand/app-icon.png"
          alt="Bamako Podcast Symbol"
          width={dim.width}
          height={dim.height}
          className="object-contain transition-transform group-hover:scale-105"
          priority
        />
      </div>
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={`font-headline font-extrabold tracking-tight text-white ${dim.text}`}>
            Bamako
          </span>
          <span className={`font-headline font-bold tracking-widest text-[#FFBF00] uppercase ${dim.sub}`}>
            Podcast
          </span>
        </div>
      )}
    </Link>
  );
};

