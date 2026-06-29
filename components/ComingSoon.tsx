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
    <div className="flex min-h-[55vh] flex-col items-start justify-center gap-3">
      <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:border-zinc-800">
        {phase}
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="max-w-sm text-zinc-500">{desc}</p>
      <p className="text-sm text-zinc-400">Disponible próximamente.</p>
    </div>
  );
}
