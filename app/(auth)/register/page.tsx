import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="relative mx-auto flex min-h-[100dvh] w-full max-w-sm flex-col justify-center gap-5 overflow-hidden p-6">
      <div className="pointer-events-none absolute inset-0 bg-[var(--grain)]" />
      <div className="relative">
        <p className="kicker-accent">// Acceso</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold leading-none tracking-tightd text-ink">
          Registro cerrado
        </h1>
        <p className="mt-3 text-ink-mute">
          Esta app es privada y las cuentas ya están creadas. Si necesitas
          acceso, habla con el administrador.
        </p>
      </div>
      <Link
        href="/login"
        className="relative inline-flex h-12 items-center justify-center gap-2 rounded-md bg-accent px-5 font-mono text-[13px] font-semibold uppercase tracking-[0.04em] text-accent-ink shadow-glow"
      >
        Iniciar sesión <span aria-hidden>→</span>
      </Link>
    </main>
  );
}
