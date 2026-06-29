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
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-2xl border-t border-zinc-200/70 bg-white/85 backdrop-blur-lg dark:border-zinc-800/70 dark:bg-zinc-950/85">
      <div className="grid grid-cols-4 pb-[env(safe-area-inset-bottom)]">
        {items.map((it) => {
          const active = pathname.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex flex-col items-center gap-1.5 py-3 text-xs font-medium transition ${
                active
                  ? "text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
              }`}
            >
              <span
                className={`h-1 w-1 rounded-full transition ${
                  active ? "bg-lime-500" : "bg-transparent"
                }`}
              />
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
