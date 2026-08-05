import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/LogoutButton";
import { BottomNav } from "@/components/BottomNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-4xl flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-ink/15 bg-bg/90 px-4 py-3 backdrop-blur-xl sm:mx-6 sm:px-0">
        <Link href="/dashboard" className="flex items-center gap-3" aria-label="Training Log · inicio">
          <span className="flex h-8 w-8 items-center justify-center bg-ink font-mono text-[10px] font-bold text-[var(--inverse-text)]">
            TL
          </span>
          <span className="font-display text-[15px] font-black uppercase leading-[0.85] tracking-[-0.04em] text-ink">
            Training<br />Log
          </span>
        </Link>
        <LogoutButton />
      </header>

      <main className="flex-1 px-4 py-8 pb-32 sm:px-6 sm:py-12">{children}</main>

      <BottomNav />
    </div>
  );
}
