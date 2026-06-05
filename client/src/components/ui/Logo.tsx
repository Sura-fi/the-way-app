"use client";

import Image from "next/image";

type LogoSize = "xs" | "sm" | "md" | "lg" | "xl" | "xxl";

interface LogoProps {
  /** Size preset for the logo */
  size?: LogoSize;
  /** Additional CSS classes */
  className?: string;
}

const dimensions: Record<LogoSize, number> = {
  xs: 24,
  sm: 32,
  md: 48,
  lg: 80,
  xl: 120,
  xxl: 180,
};

export function Logo({
  size = "md",
  className = "",
}: LogoProps) {
  const dim = dimensions[size];
  return (
    <Image
      src="/image/logo-transparent.png"
      alt="መንገዱ — The Way"
      width={dim}
      height={dim}
      quality={100}
      priority={size === "xl" || size === "lg"}
      className={`object-contain ${className}`}
    />
  );
}

/**
 * Browser icon variant — the floral/crown design.
 * Used where a simpler, more abstract icon is preferred.
 */
export function BrowserIcon({
  size = "md",
  className = "",
}: LogoProps) {
  const dim = dimensions[size];
  return (
    <Image
      src="/image/icon-transparent.png"
      alt="መንገዱ — The Way"
      width={dim}
      height={dim}
      quality={100}
      priority={size === "xl" || size === "lg"}
      className={`object-contain ${className}`}
    />
  );
}
