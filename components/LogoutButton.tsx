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
      className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-mute transition hover:text-ink disabled:opacity-50"
    >
      {loading ? "Saliendo" : "Salir"}
    </button>
  );
}
