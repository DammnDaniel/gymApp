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
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col">
      <header className="sticky top-0 z-20 mx-3 mt-2 flex items-center justify-between rounded-2xl border border-white/[0.06] bg-bg/75 px-4 py-3 backdrop-blur-2xl sm:mx-5">
        <Link href="/dashboard" className="flex items-center" aria-label="GymApp · inicio">
          <span className="font-display text-lg font-extrabold tracking-tightd">
            <span className="text-ink">GYM</span>
            <span className="text-accent">APP</span>
          </span>
        </Link>
        <LogoutButton />
      </header>

      <main className="flex-1 px-4 py-7 pb-32 sm:px-6 sm:py-9">{children}</main>

      <BottomNav />
    </div>
  );
}
