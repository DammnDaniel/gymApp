import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="text-3xl font-bold tracking-tight">Registro cerrado</h1>
      <p className="text-neutral-500">
        Esta app es privada y las cuentas ya están creadas. Si necesitas acceso,
        habla con el administrador.
      </p>
      <Link
        href="/login"
        className="mt-2 inline-block rounded-lg bg-neutral-900 px-4 py-2.5 text-center font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        Ir a iniciar sesión
      </Link>
    </main>
  );
}
