export function PageIntro({
  eyebrow,
  title,
  count,
  countLabel,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  count?: number | string;
  countLabel?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="grid gap-5 border-b border-ink pb-6 sm:grid-cols-[1fr_auto] sm:items-end">
      <div>
        <p className="kicker-accent">{eyebrow}</p>
        <h1 className="page-title mt-3">{title}</h1>
        {description && (
          <p className="mt-4 max-w-[48ch] text-sm leading-6 text-ink-mute">
            {description}
          </p>
        )}
      </div>
      {(count !== undefined || action) && (
        <div className="flex items-end justify-between gap-6 sm:flex-col sm:items-end">
          {count !== undefined && (
            <div className="text-left sm:text-right">
              <span className="font-display text-4xl font-black leading-none tracking-[-0.06em] text-ink">
                {count}
              </span>
              {countLabel && (
                <span className="ml-2 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-mute">
                  {countLabel}
                </span>
              )}
            </div>
          )}
          {action}
        </div>
      )}
    </header>
  );
}
