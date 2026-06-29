import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/LogoutButton";

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
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight">
          GymApp
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/dashboard" className="hover:underline">
            Inicio
          </Link>
          <Link href="/profile" className="hover:underline">
            Perfil
          </Link>
          <LogoutButton />
        </nav>
      </header>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
