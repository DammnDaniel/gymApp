export default function Home() {
  const supabaseConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-start justify-center gap-4 p-8">
      <h1 className="text-3xl font-bold tracking-tight">GymApp</h1>
      <p className="text-neutral-500">
        Fase 0 ✅ — scaffold Next.js + Tailwind + TanStack Query listo.
      </p>
      <div className="rounded-lg border border-neutral-200 px-4 py-3 text-sm dark:border-neutral-800">
        <span className="font-medium">Supabase: </span>
        {supabaseConfigured ? (
          <span className="text-green-600">configurado</span>
        ) : (
          <span className="text-amber-600">
            pendiente de credenciales (sección 1)
          </span>
        )}
      </div>
    </main>
  );
}
