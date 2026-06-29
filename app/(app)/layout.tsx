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
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-2xl flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-zinc-200/70 bg-white/80 px-5 py-3.5 backdrop-blur-lg dark:border-zinc-800/70 dark:bg-zinc-950/80">
        <Link
          href="/dashboard"
          className="text-base font-semibold tracking-tight"
        >
          Gym<span className="text-lime-500">App</span>
        </Link>
        <LogoutButton />
      </header>

      <main className="flex-1 px-5 py-6 pb-28">{children}</main>

      <BottomNav />
    </div>
  );
}
