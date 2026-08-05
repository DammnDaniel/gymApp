"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => console.error(error), [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-xl border border-border bg-surface p-7 text-center shadow-hero">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-xl text-danger">
        !
      </div>
      <div>
        <p className="kicker-accent">// Algo ha fallado</p>
        <h1 className="mt-2 font-display text-xl font-extrabold text-ink">
          No hemos podido cargar esta pantalla
        </h1>
        <p className="mt-2 text-sm text-ink-mute">
          Tus datos no se han borrado. Reintenta la operación.
        </p>
      </div>
      <button
        onClick={reset}
        className="inline-flex h-11 items-center justify-center rounded-md bg-accent px-5 font-mono text-[12px] font-semibold uppercase text-accent-ink shadow-glow"
      >
        Reintentar
      </button>
    </div>
  );
}
