"use client";

import React from "react";

export interface HazenorLogoProps {
  /**
   * 1. "primary": Geometric H monogram + HAZENOR PROPERTIES wordmark
   * 2. "wordmark": HAZENOR PROPERTIES wordmark only
   * 3. "symbol": Architectural Geometric H monogram only
   * 4. "product": Geometric H monogram + HAZENOR PROPERTIES with Property Management Platform subtitle
   */
  variant?: "primary" | "wordmark" | "symbol" | "product";
  /**
   * Color adaptation:
   * - "dark": For dark Midnight Navy (#172B38) backgrounds (Champagne Gold monogram + Warm Ivory text)
   * - "light": For Warm Ivory (#EAE5DB / #F6F4EF) or white backgrounds (Midnight Navy & Champagne Gold monogram + Midnight Navy text)
   * - "monochrome-white": Pure white monochrome
   * - "monochrome-dark": Pure Midnight Navy (#172B38) monochrome
   */
  theme?: "dark" | "light" | "monochrome-white" | "monochrome-dark";
  size?: "sm" | "md" | "lg";
  showSlogan?: boolean;
  className?: string;
}

export function HazenorSymbol({
  theme = "dark",
  className = "h-9 w-9",
}: {
  theme?: HazenorLogoProps["theme"];
  className?: string;
}) {
  const uid = React.useId().replace(/:/g, "");
  const isMonoWhite = theme === "monochrome-white";
  const isMonoDark = theme === "monochrome-dark";
  const isLightBg = theme === "light";

  const primaryStroke = isMonoWhite
    ? "#FFFFFF"
    : isMonoDark
    ? "#172B38"
    : `url(#hazenorGold-${uid})`;

  const secondaryFill = isMonoWhite
    ? "#FFFFFF"
    : isMonoDark
    ? "#172B38"
    : isLightBg
    ? "#172B38"
    : `url(#hazenorGold-${uid})`;

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`hazenorGold-${uid}`} x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#DFD1B4" />
          <stop offset="50%" stopColor="#C9B58E" />
          <stop offset="100%" stopColor="#A89268" />
        </linearGradient>
      </defs>

      {/* Outer Architectural Hexagonal Frame */}
      <path
        d="M32 4L56 17.5V46.5L32 60L8 46.5V17.5L32 4Z"
        stroke={primaryStroke}
        strokeWidth="1.5"
        strokeOpacity="0.45"
      />

      {/* Left Outer Architectural Pillar */}
      <path
        d="M14 17L20.5 13.2V50.8L14 47V17Z"
        fill={secondaryFill}
      />

      {/* Left Inner Pillar (Upper) */}
      <path
        d="M23.5 11.5L29 8.3V28.5L23.5 31.8V11.5Z"
        fill={`url(#hazenorGold-${uid})`}
      />

      {/* Right Outer Architectural Pillar */}
      <path
        d="M50 17L43.5 13.2V50.8L50 47V17Z"
        fill={secondaryFill}
      />

      {/* Right Inner Pillar (Upper) */}
      <path
        d="M40.5 11.5L35 8.3V28.5L40.5 31.8V11.5Z"
        fill={`url(#hazenorGold-${uid})`}
      />

      {/* Central Architectural Apex Bridge & Lower Pillars (Forming the H & Structure) */}
      <path
        d="M23.5 36.2L32 30.8L40.5 36.2V55.5L35 52.3V39.2L32 37.2L29 39.2V52.3L23.5 55.5V36.2Z"
        fill={`url(#hazenorGold-${uid})`}
      />
    </svg>
  );
}

export function HazenorLogo({
  variant = "primary",
  theme = "light",
  size = "md",
  showSlogan = false,
  className = "",
}: HazenorLogoProps) {
  const symbolSize =
    size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12" : "h-10 w-10";

  const titleColor =
    theme === "dark" || theme === "monochrome-white"
      ? "text-[#EAE5DB]"
      : "text-[#172B38]";

  const subColor =
    theme === "dark" || theme === "monochrome-white"
      ? "text-[#C9B58E]"
      : "text-[#303437]";

  if (variant === "symbol") {
    return <HazenorSymbol theme={theme} className={`${symbolSize} ${className}`} />;
  }

  if (variant === "wordmark") {
    return (
      <div className={`inline-flex flex-col ${className}`}>
        <span
          className={`font-serif font-semibold tracking-[0.22em] uppercase leading-none ${
            size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-lg"
          } ${titleColor}`}
        >
          HAZENOR
        </span>
        <span className="mt-1 flex items-center gap-2 text-[9px] font-medium tracking-[0.28em] uppercase text-[#C9B58E]">
          <span className="h-px w-3 bg-[#C9B58E]/60" />
          <span>PROPERTIES</span>
          <span className="h-px w-3 bg-[#C9B58E]/60" />
        </span>
      </div>
    );
  }

  if (variant === "product") {
    return (
      <div className={`inline-flex items-center gap-2.5 sm:gap-3 min-w-0 ${className}`}>
        <HazenorSymbol theme={theme} className={`${symbolSize} shrink-0`} />
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span
              className={`font-serif font-bold tracking-[0.16em] sm:tracking-[0.18em] uppercase leading-none ${
                size === "sm" ? "text-sm sm:text-base" : size === "lg" ? "text-xl" : "text-base sm:text-lg"
              } ${titleColor}`}
            >
              HAZENOR
            </span>
            <span className="h-2.5 sm:h-3 w-px bg-[#C9B58E]/50 shrink-0" />
            <span className="text-[9px] sm:text-[10px] font-semibold tracking-[0.18em] sm:tracking-[0.2em] uppercase text-[#C9B58E] truncate">
              PROPERTIES
            </span>
          </div>
          <span
            className={`mt-0.5 sm:mt-1 text-[9px] sm:text-[10px] tracking-[0.12em] sm:tracking-[0.14em] uppercase font-medium hidden xs:block sm:block ${
              theme === "dark" ? "text-[#EAE5DB]/70" : "text-[#303437]/75"
            }`}
          >
            Property Management Platform
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3.5 ${className}`}>
      <HazenorSymbol theme={theme} className={symbolSize} />
      <div className="flex flex-col">
        <span
          className={`font-serif font-semibold tracking-[0.22em] uppercase leading-none ${
            size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-xl"
          } ${titleColor}`}
        >
          HAZENOR
        </span>
        <span
          className={`mt-1 flex items-center gap-2 text-[9px] font-semibold tracking-[0.26em] uppercase ${subColor}`}
        >
          <span className="h-px w-3 bg-[#C9B58E]" />
          <span>PROPERTIES</span>
          <span className="h-px w-3 bg-[#C9B58E]" />
        </span>
        {showSlogan && (
          <span className="mt-1 font-serif italic text-xs text-[#C9B58E]">
            A Legacy Built on Trust.
          </span>
        )}
      </div>
    </div>
  );
}
