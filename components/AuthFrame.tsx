export function AuthFrame({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-[100dvh] items-stretch bg-bg sm:p-4">
      <div className="mx-auto grid w-full max-w-5xl border-ink bg-bg-0 sm:border md:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative hidden min-h-[calc(100dvh-2rem)] overflow-hidden border-r border-ink bg-inverse p-10 text-[var(--inverse-text)] md:flex md:flex-col md:justify-between">
          <div className="pointer-events-none absolute inset-0 bg-[var(--grain)] bg-[length:32px_32px] opacity-20" />
          <div className="relative flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center bg-accent font-mono text-[11px] font-black text-ink">TL</span>
            <span className="font-display text-lg font-black uppercase leading-[0.85] tracking-[-0.05em]">Training<br />Log</span>
          </div>
          <div className="relative">
            <p className="max-w-[9ch] font-display text-[clamp(3.2rem,7vw,6.5rem)] font-black uppercase leading-[0.78] tracking-[-0.075em]">
              Train.<br /><span className="text-accent">Record.</span><br />Repeat.
            </p>
            <p className="mt-8 max-w-[32ch] border-l-2 border-signal pl-4 text-sm leading-6 text-[#b9c0bc]">
              Un cuaderno de trabajo para entrenar con intención y conservar cada avance.
            </p>
          </div>
          <p className="relative font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#89928d]">
            Personal training system · 2026
          </p>
        </aside>

        <section className="flex min-h-[100dvh] flex-col justify-center px-5 py-10 sm:px-10 md:min-h-0 md:px-14 lg:px-20">
          <div className="mb-12 flex items-center gap-3 md:hidden">
            <span className="flex h-9 w-9 items-center justify-center bg-inverse font-mono text-[10px] font-black text-[var(--inverse-text)]">TL</span>
            <span className="font-display text-base font-black uppercase leading-[0.85] tracking-[-0.05em] text-ink">Training<br />Log</span>
          </div>
          <div className="w-full max-w-md">
            <p className="kicker-accent">{eyebrow}</p>
            <h1 className="mt-3 font-display text-[clamp(2.5rem,10vw,4.75rem)] font-black leading-[0.88] tracking-[-0.065em] text-ink">
              {title}
            </h1>
            <p className="mt-5 max-w-[40ch] text-sm leading-6 text-ink-mute">
              {description}
            </p>
            <div className="mt-8">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
