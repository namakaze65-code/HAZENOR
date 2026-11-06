"use client";

import React, { useEffect, useRef, useState } from "react";

interface RevealOnScrollProps {
  children: React.ReactNode;
  delayMs?: number;
  className?: string;
}

export function RevealOnScroll({
  children,
  delayMs = 0,
  className = "",
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setVisible(true);
      return;
    }

    const rect = el.getBoundingClientRect();
    const isInitiallyInView = rect.top < window.innerHeight * 0.95;
    if (isInitiallyInView) {
      setVisible(true);
      return;
    }

    setVisible(false);
    const fallbackTimer = window.setTimeout(() => setVisible(true), 1200);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -20px 0px" }
    );

    observer.observe(el);
    return () => {
      window.clearTimeout(fallbackTimer);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delayMs}ms` }}
      className={`transition-all duration-700 ease-out ${
        visible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-5 scale-[0.99]"
      } ${className}`}
    >
      {children}
    </div>
  );
}
