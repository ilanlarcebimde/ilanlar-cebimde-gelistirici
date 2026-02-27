"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";

interface SafeExternalLinkProps extends Omit<ComponentPropsWithoutRef<"a">, "target" | "rel"> {
  href: string;
  children: ReactNode;
}

/**
 * Dış linkler için güvenli bileşen: target="_blank" + rel="noopener noreferrer" zorunlu.
 * SEO ve güvenlik uyarılarını giderir.
 */
export function SafeExternalLink({ href, children, ...rest }: SafeExternalLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      {...rest}
    >
      {children}
    </a>
  );
}
