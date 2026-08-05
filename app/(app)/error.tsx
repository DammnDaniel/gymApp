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
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 border border-ink bg-surface p-7 text-center shadow-hero">
      <div className="flex h-12 w-12 items-center justify-center border border-danger bg-[rgba(199,45,39,0.09)] text-xl text-danger">
        !
      </div>
      <div>
        <p className="kicker-accent">Algo ha fallado</p>
        <h1 className="mt-2 font-display text-xl font-extrabold text-ink">
          No hemos podido cargar esta pantalla
        </h1>
        <p className="mt-2 text-sm text-ink-mute">
          Tus datos no se han borrado. Reintenta la operación.
        </p>
      </div>
      <button
        onClick={reset}
        className="button-primary"
      >
        Reintentar
      </button>
    </div>
  );
}
