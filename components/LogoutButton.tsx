"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { logout } from "@/lib/auth";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    await logout();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="min-h-11 border-l border-ink/20 pl-4 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-mute transition hover:text-accent-press disabled:opacity-50"
    >
      {loading ? "Saliendo" : "Salir"}
    </button>
  );
}
