export function ComingSoon({
  title,
  desc,
  phase,
}: {
  title: string;
  desc: string;
  phase: string;
}) {
  return (
    <div className="flex min-h-[55vh] flex-col items-start justify-center gap-4">
      <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent-soft px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-accent">
        Pronto · {phase}
      </span>
      <h1 className="font-display text-3xl font-extrabold leading-none tracking-tightd text-ink">
        {title}
      </h1>
      <p className="max-w-sm text-ink-mute">{desc}</p>

      <div className="mt-2 flex gap-8">
        {["—", "—", "—"].map((v, i) => (
          <div key={i} className="flex flex-col">
            <span className="font-display text-2xl font-extrabold tabular-nums text-ink-faint">
              {v}
            </span>
            <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint">
              {["Series", "Récords", "Días"][i]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
