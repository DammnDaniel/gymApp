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
    <div className="flex flex-col items-start gap-3">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="text-neutral-500">{desc}</p>
      <span className="mt-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
        🚧 Próximamente · {phase}
      </span>
    </div>
  );
}
