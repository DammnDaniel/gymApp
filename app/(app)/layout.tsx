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
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-bg/80 px-5 py-3.5 backdrop-blur-xl">
        <Link href="/dashboard" className="flex items-center">
          <span className="font-display text-lg font-extrabold tracking-tightd">
            <span className="text-ink">GYM</span>
            <span className="text-accent">APP</span>
          </span>
        </Link>
        <LogoutButton />
      </header>

      <main className="flex-1 px-5 py-6 pb-32">{children}</main>

      <BottomNav />
    </div>
  );
}
