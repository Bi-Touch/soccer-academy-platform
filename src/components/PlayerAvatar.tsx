"use client";

import { useState } from "react";
import Image from "next/image";

export function PlayerAvatar({
  src,
  alt,
  size = 96,
  rounded = false,
}: {
  src: string | null;
  alt: string;
  size?: number;
  rounded?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const borderRadius = rounded ? "50%" : 0;

  if (!src || failed) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius,
          background: "var(--pitch-dark)",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--chalk)",
          fontSize: size / 3,
        }}
        aria-label={alt}
      >
        {alt
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      style={{ borderRadius, objectFit: "cover", flexShrink: 0 }}
    />
  );
}