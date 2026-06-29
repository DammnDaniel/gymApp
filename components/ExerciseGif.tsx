"use client";

import { useEffect, useState } from "react";

export function ExerciseGif({
  start,
  end,
  alt,
}: {
  start: string | null;
  end: string | null;
  alt: string;
}) {
  const [showEnd, setShowEnd] = useState(false);

  useEffect(() => {
    if (!end) return;
    const id = setInterval(() => setShowEnd((v) => !v), 750);
    return () => clearInterval(id);
  }, [end]);

  if (!start) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-surface-3 font-mono text-[11px] uppercase tracking-kicker text-ink-faint shadow-hero">
        Sin imagen
      </div>
    );
  }

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-surface-3 shadow-hero">
      <img
        src={start}
        alt={alt}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
          showEnd && end ? "opacity-0" : "opacity-100"
        }`}
      />
      {end && (
        <img
          src={end}
          alt=""
          aria-hidden
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
            showEnd ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}
