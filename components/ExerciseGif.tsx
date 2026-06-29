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
      <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-zinc-100 text-sm text-zinc-400 dark:bg-zinc-900">
        Sin imagen
      </div>
    );
  }

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800">
      <img
        src={start}
        alt={alt}
        className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${
          showEnd && end ? "opacity-0" : "opacity-100"
        }`}
      />
      {end && (
        <img
          src={end}
          alt=""
          aria-hidden
          className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${
            showEnd ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}
