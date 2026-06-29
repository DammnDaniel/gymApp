import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-sm flex-col justify-center gap-5 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Registro cerrado</h1>
        <p className="text-zinc-500">
          Esta app es privada y las cuentas ya están creadas. Si necesitas
          acceso, habla con el administrador.
        </p>
      </div>
      <Link
        href="/login"
        className="rounded-xl bg-zinc-900 px-4 py-3 text-center font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Ir a iniciar sesión
      </Link>
    </main>
  );
}
