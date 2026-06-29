"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/routines", label: "Rutinas" },
  { href: "/exercises", label: "Biblioteca" },
  { href: "/progress", label: "Progreso" },
  { href: "/profile", label: "Perfil" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom))] z-20 mx-auto max-w-md rounded-[20px] border border-border bg-surface-2/90 p-1.5 shadow-hero backdrop-blur-xl">
      <div className="grid grid-cols-4 gap-1">
        {items.map((it) => {
          const active = pathname.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={
                active
                  ? "flex items-center justify-center rounded-xl bg-accent px-2.5 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-accent-ink transition"
                  : "flex items-center justify-center rounded-xl px-2.5 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-faint transition hover:text-ink-mute"
              }
            >
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
