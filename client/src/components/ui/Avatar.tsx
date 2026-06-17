"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { fileToAvatarDataUrl } from "@/lib/image";

export function Avatar({
  src,
  name,
  sizeClasses = "w-20 h-20",
  textClasses = "text-3xl",
}: {
  src?: string | null;
  name?: string;
  sizeClasses?: string;
  textClasses?: string;
}) {
  const initial = name?.charAt(0)?.toUpperCase() || "?";
  return (
    <div
      className={`${sizeClasses} rounded-full overflow-hidden bg-gold-muted/15 text-gold-muted ${textClasses} font-bold flex items-center justify-center shrink-0`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name || "avatar"} className="w-full h-full object-cover" />
      ) : (
        initial
      )}
    </div>
  );
}