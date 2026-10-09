"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

/** RSS artwork can originate from any podcast host; external files load in the browser. */
export default function PodcastCover({ src, onError, ...props }: ImageProps) {
  const [failedSource, setFailedSource] = useState<ImageProps["src"] | null>(null);
  let usableSource = src;
  if (typeof src === "string") {
    const trimmed = src.trim();
    const local = trimmed.startsWith("/") && !trimmed.startsWith("//");
    let remote = false;
    try {
      const url = new URL(trimmed);
      remote = (url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password;
    } catch { /* Non-URL values must be local absolute paths. */ }
    usableSource = local || remote ? trimmed : "/placeholder.svg";
  }
  const displaySource = failedSource === src ? "/placeholder.svg" : usableSource;
  const external = typeof displaySource === "string" && /^https?:\/\//.test(displaySource);
  return (
    <Image
      {...props}
      src={displaySource}
      unoptimized={external || props.unoptimized}
      onError={event => {
        setFailedSource(src);
        onError?.(event);
      }}
    />
  );
}
