"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Inicio", icon: "home" },
  { href: "/routines", label: "Rutinas", icon: "list" },
  { href: "/exercises", label: "Ejercicios", icon: "bolt" },
  { href: "/history", label: "Historial", icon: "clock" },
  { href: "/profile", label: "Perfil", icon: "user" },
] as const;

function NavIcon({ name }: { name: (typeof items)[number]["icon"] }) {
  const common = {
    viewBox: "0 0 24 24",
    className: "h-[19px] w-[19px]",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (name === "home")
    return <svg {...common}><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>;
  if (name === "list")
    return <svg {...common}><path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></svg>;
  if (name === "bolt")
    return <svg {...common}><path d="m13 2-9 12h7l-1 8 10-13h-7V2Z"/></svg>;
  if (name === "clock")
    return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
  return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></svg>;
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-2.5 bottom-[calc(8px+env(safe-area-inset-bottom))] z-30 mx-auto max-w-[620px] rounded-[22px] border border-white/[0.08] bg-surface/90 p-1.5 shadow-hero backdrop-blur-2xl"
    >
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 transition active:scale-95 ${
                active
                  ? "bg-accent text-accent-ink shadow-glow"
                  : "text-ink-faint hover:bg-surface-2 hover:text-ink"
              }`}
            >
              <NavIcon name={item.icon} />
              <span className="max-w-full truncate font-mono text-[8px] font-semibold uppercase tracking-[0.04em] sm:text-[9px]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
