"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Inicio", icon: "home", index: "01" },
  { href: "/routines", label: "Plan", icon: "list", index: "02" },
  { href: "/coach", label: "Coach", icon: "coach", index: "03" },
  { href: "/exercises", label: "Técnica", icon: "bolt", index: "04" },
  { href: "/history", label: "Diario", icon: "clock", index: "05" },
  { href: "/profile", label: "Perfil", icon: "user", index: "06" },
] as const;

function NavIcon({ name }: { name: (typeof items)[number]["icon"] }) {
  const common = {
    viewBox: "0 0 24 24",
    className: "h-[18px] w-[18px]",
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
  if (name === "coach")
    return <svg {...common}><path d="M5 5h14v10H9l-4 4V5Z"/><path d="M9 9h6M9 12h4"/></svg>;
  return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></svg>;
}

export function BottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/workout/")) return null;

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-2.5 bottom-[calc(8px+env(safe-area-inset-bottom))] z-30 mx-auto max-w-[760px] border border-ink bg-inverse px-1.5 py-1.5 shadow-hero"
    >
      <div className="grid grid-cols-6 gap-1">
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
              className={`relative flex min-h-[54px] min-w-0 flex-col items-center justify-center gap-1 px-1 py-1.5 transition active:translate-y-px ${
                active
                  ? "bg-accent text-accent-ink"
                  : "text-[#b8beb9] hover:bg-white/[0.07] hover:text-white"
              }`}
            >
              <span className="absolute left-1.5 top-1 font-mono text-[7px] font-bold opacity-65" aria-hidden>
                {item.index}
              </span>
              <NavIcon name={item.icon} />
              <span className="max-w-full truncate font-mono text-[8px] font-semibold uppercase tracking-[0.06em] sm:text-[9px]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
