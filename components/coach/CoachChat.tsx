"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import type {
  CoachMemory,
  CoachMessage,
  CoachOperation,
  CoachProposal,
  CoachThread,
} from "@/lib/coach/types";

const starters = [
  "Analiza mi rutina completa y dime qué mejorarías",
  "¿Tengo suficiente volumen de espalda y pierna?",
  "Quiero sustituir un ejercicio que no hago cómodo",
  "Organiza mejor los días para coincidir con la otra rutina",
];

const memoryLabels: Record<CoachMemory["category"], string> = {
  preference: "Preferencia",
  limitation: "Limitación",
  goal: "Objetivo",
  equipment: "Equipo",
  schedule: "Horario",
};

function proposalIdFromMessage(message: CoachMessage) {
  const id = message.metadata?.proposal_id;
  return typeof id === "string" ? id : null;
}

function operationTitle(operation: CoachOperation) {
  if (operation.type === "replace_exercise") {
    return `${operation.current_exercise_name ?? "Ejercicio"} → ${operation.exercise_name ?? "sustituto"}`;
  }
  if (operation.type === "add_exercise") {
    return `Añadir ${operation.exercise_name ?? "ejercicio"}`;
  }
  if (operation.type === "remove_exercise") {
    return `Quitar ${operation.current_exercise_name ?? "ejercicio"}`;
  }
  if (operation.type === "move_exercise") {
    return `Mover ${operation.current_exercise_name ?? "ejercicio"}`;
  }
  return `Ajustar ${operation.current_exercise_name ?? "ejercicio"}`;
}

function prescription(operation: CoachOperation) {
  const parts: string[] = [];
  if (operation.target_sets) parts.push(`${operation.target_sets} series`);
  if (operation.target_reps_min && operation.target_reps_max) {
    parts.push(`${operation.target_reps_min}–${operation.target_reps_max} reps`);
  } else if (operation.target_reps_min) {
    parts.push(`${operation.target_reps_min} reps`);
  }
  return parts.join(" · ");
}

function ProposalCard({
  proposal,
  onAction,
  pending,
}: {
  proposal: CoachProposal;
  onAction: (proposal: CoachProposal, action: "apply" | "reject" | "undo") => void;
  pending: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const statusLabel = {
    pending: "Pendiente",
    applied: "Aplicada",
    rejected: "Descartada",
    undone: "Deshecha",
  }[proposal.status];

  return (
    <section className="my-5 border border-ink bg-surface shadow-card">
      <div className="flex items-start justify-between gap-4 border-b border-border bg-bg-elev-0 px-4 py-3">
        <div>
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-signal">
            Propuesta de rutina
          </p>
          <h3 className="mt-1 font-display text-lg font-black tracking-[-0.035em] text-ink">
            {proposal.title}
          </h3>
        </div>
        <span
          className={`shrink-0 px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.1em] ${
            proposal.status === "applied"
              ? "bg-signal text-white"
              : proposal.status === "pending"
                ? "bg-accent text-accent-ink"
                : "bg-surface-2 text-ink-mute"
          }`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="p-4">
        <p className="text-sm leading-6 text-ink-mute">{proposal.summary}</p>
        <div className="mt-4 divide-y divide-border border-y border-border">
          {proposal.operations.map((operation, index) => (
            <div key={`${operation.type}-${index}`} className="grid gap-1 py-3 sm:grid-cols-[1fr_auto] sm:gap-4">
              <div>
                <p className="text-sm font-bold text-ink">{operationTitle(operation)}</p>
                <p className="mt-1 text-xs leading-5 text-ink-mute">{operation.reason}</p>
              </div>
              <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-ink-faint sm:text-right">
                {operation.day_name && <div>{operation.day_name}</div>}
                {prescription(operation) && <div className="mt-1 text-signal">{prescription(operation)}</div>}
              </div>
            </div>
          ))}
        </div>

        {proposal.status === "pending" && !confirming && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button className="button-secondary" disabled={pending} onClick={() => onAction(proposal, "reject")}>
              Descartar
            </button>
            <button className="button-primary" disabled={pending} onClick={() => setConfirming(true)}>
              Revisar y aplicar
            </button>
          </div>
        )}

        {proposal.status === "pending" && confirming && (
          <div className="mt-4 border-l-4 border-accent bg-accent-soft p-4">
            <p className="text-sm font-bold text-ink">¿Aplicar estos cambios a tu rutina?</p>
            <p className="mt-1 text-xs leading-5 text-ink-mute">
              Se guardará una copia anterior. Podrás deshacer mientras no edites después la rutina.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="button-secondary" disabled={pending} onClick={() => setConfirming(false)}>
                Cancelar
              </button>
              <button className="button-primary" disabled={pending} onClick={() => onAction(proposal, "apply")}>
                {pending ? "Aplicando…" : "Confirmar cambio"}
              </button>
            </div>
          </div>
        )}

        {proposal.status === "applied" && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-signal">
              Rutina actualizada con copia de seguridad
            </p>
            <button className="button-secondary" disabled={pending} onClick={() => onAction(proposal, "undo")}>
              {pending ? "Deshaciendo…" : "Deshacer cambio"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export function CoachChat({
  initialThreads,
  initialThread,
  initialMessages,
  initialProposals,
  memories,
  apiReady,
}: {
  initialThreads: CoachThread[];
  initialThread: CoachThread | null;
  initialMessages: CoachMessage[];
  initialProposals: CoachProposal[];
  memories: CoachMemory[];
  apiReady: boolean;
}) {
  const [threads, setThreads] = useState(initialThreads);
  const [thread, setThread] = useState<CoachThread | null>(initialThread);
  const [messages, setMessages] = useState(initialMessages);
  const [proposals, setProposals] = useState(initialProposals);
  const [rememberedContext, setRememberedContext] = useState(memories);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [proposalBusy, setProposalBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, proposals, busy]);

  const proposalMap = useMemo(
    () => new Map(proposals.map((proposal) => [proposal.id, proposal])),
    [proposals],
  );

  async function loadThread(threadId: string) {
    if (threadId === thread?.id || busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/coach?thread_id=${encodeURIComponent(threadId)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo cargar");
      setThread(data.thread);
      setMessages(data.messages);
      setProposals(data.proposals);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudo cargar la conversación");
    } finally {
      setBusy(false);
    }
  }

  function newThread() {
    if (busy) return;
    setThread(null);
    setMessages([]);
    setProposals([]);
    setError(null);
    setInput("");
  }

  async function sendMessage(value?: string) {
    const content = (value ?? input).trim();
    if (!content || busy || !apiReady) return;
    setBusy(true);
    setError(null);
    setInput("");

    const optimistic: CoachMessage = {
      id: `temp-${Date.now()}`,
      thread_id: thread?.id ?? "pending",
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((current) => [...current, optimistic]);

    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, thread_id: thread?.id ?? null }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.thread && data.message) {
          setThread(data.thread);
          setMessages((current) =>
            current.map((item) => (item.id === optimistic.id ? data.message : item)),
          );
          setThreads((current) => {
            const rest = current.filter((item) => item.id !== data.thread.id);
            return [{ ...data.thread, updated_at: new Date().toISOString() }, ...rest];
          });
        }
        throw new Error(data.error || "El Coach no ha podido responder");
      }

      setThread(data.thread);
      setMessages((current) => [
        ...current.map((message) =>
          message.id === optimistic.id ? { ...message, thread_id: data.thread.id } : message,
        ),
        data.message,
      ]);
      if (data.proposal) setProposals((current) => [...current, data.proposal]);
      if (Array.isArray(data.memories)) setRememberedContext(data.memories);
      setThreads((current) => {
        const rest = current.filter((item) => item.id !== data.thread.id);
        return [{ ...data.thread, updated_at: new Date().toISOString() }, ...rest];
      });
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "El Coach no ha podido responder");
    } finally {
      setBusy(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  async function updateProposal(
    proposal: CoachProposal,
    action: "apply" | "reject" | "undo",
  ) {
    setProposalBusy(proposal.id);
    setError(null);
    try {
      const response = await fetch(`/api/coach/proposals/${proposal.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo actualizar la propuesta");
      setProposals((current) =>
        current.map((item) => (item.id === data.proposal.id ? data.proposal : item)),
      );
    } catch (proposalError) {
      setError(
        proposalError instanceof Error ? proposalError.message : "No se pudo actualizar la propuesta",
      );
    } finally {
      setProposalBusy(null);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void sendMessage();
  }

  return (
    <div className="-mt-2 grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
      <aside className="order-2 space-y-4 lg:order-1">
        <div className="panel p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="kicker">Conversaciones</p>
            <button
              onClick={newThread}
              className="font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-accent-press hover:text-ink"
            >
              + Nueva
            </button>
          </div>
          {threads.length ? (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
              {threads.map((item) => (
                <button
                  key={item.id}
                  onClick={() => void loadThread(item.id)}
                  className={`min-w-[180px] border px-3 py-3 text-left text-xs leading-4 transition lg:min-w-0 ${
                    item.id === thread?.id
                      ? "border-ink bg-ink text-[var(--inverse-text)]"
                      : "border-border bg-bg-elev-0 text-ink-mute hover:border-ink"
                  }`}
                >
                  <span className="line-clamp-2 font-semibold">{item.title}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs leading-5 text-ink-faint">Todavía no hay conversaciones.</p>
          )}
        </div>

        <div className="panel p-4">
          <p className="kicker">Contexto recordado</p>
          {rememberedContext.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {rememberedContext.map((memory) => (
                <span key={memory.id} className="border border-border bg-bg-elev-0 px-2.5 py-2 text-[10px] leading-4 text-ink-mute">
                  <strong className="block font-mono text-[8px] uppercase tracking-[0.08em] text-signal">
                    {memoryLabels[memory.category]}
                  </strong>
                  {memory.content}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs leading-5 text-ink-faint">
              Aprenderá tus preferencias cuando se las indiques claramente.
            </p>
          )}
        </div>
      </aside>

      <section className="order-1 min-w-0 border border-ink bg-bg-elev-0 shadow-hero lg:order-2">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-ink bg-inverse px-5 py-5 text-[var(--inverse-text)] sm:px-6">
          <div>
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-accent">
              Coach contextual · Gemini gratis
            </p>
            <h1 className="mt-2 font-display text-[clamp(2rem,8vw,3.4rem)] font-black leading-[0.88] tracking-[-0.06em]">
              Pregunta.<br />Comprueba. Decide.
            </h1>
          </div>
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.1em] text-[#b8beb9]">
            <span className={`h-2 w-2 rounded-full ${apiReady ? "bg-[#67d391]" : "bg-accent"}`} />
            {apiReady ? "Disponible" : "Sin configurar"}
          </div>
        </header>

        <div className="min-h-[420px] px-4 py-5 sm:min-h-[520px] sm:px-6">
          {!apiReady && (
            <div className="mb-5 border-l-4 border-accent bg-accent-soft p-4">
              <p className="font-bold text-ink">Falta conectar el motor de IA</p>
              <p className="mt-1 text-sm leading-6 text-ink-mute">
                La interfaz y la protección de datos están preparadas, pero el servidor todavía no tiene credenciales para responder.
              </p>
            </div>
          )}

          {!messages.length && (
            <div className="mx-auto flex max-w-xl flex-col items-center py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center border border-ink bg-accent font-display text-xl font-black text-accent-ink">
                C
              </div>
              <h2 className="mt-5 font-display text-2xl font-black tracking-[-0.045em] text-ink">
                Empieza por una duda real.
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-ink-mute">
                Puede consultar tus rutinas e historial, buscar sustituciones y preparar cambios que tú revisarás antes de aplicar.
              </p>
              <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
                {starters.map((starter) => (
                  <button
                    key={starter}
                    disabled={!apiReady || busy}
                    onClick={() => void sendMessage(starter)}
                    className="min-h-14 border border-border bg-surface px-3 py-3 text-left text-xs font-semibold leading-5 text-ink transition hover:border-ink hover:bg-white disabled:opacity-45"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mx-auto max-w-2xl">
            {messages.map((message) => {
              const linkedProposal =
                message.role === "assistant" && proposalIdFromMessage(message)
                  ? proposalMap.get(proposalIdFromMessage(message)!)
                  : null;
              return (
                <div key={message.id}>
                  <article
                    className={`mb-4 ${
                      message.role === "user"
                        ? "ml-auto max-w-[88%] border border-ink bg-ink px-4 py-3 text-[var(--inverse-text)]"
                        : "mr-auto max-w-[95%] border-l-4 border-signal bg-surface px-4 py-4 text-ink"
                    }`}
                  >
                    <p className={`mb-2 font-mono text-[8px] font-bold uppercase tracking-[0.12em] ${message.role === "user" ? "text-accent" : "text-signal"}`}>
                      {message.role === "user" ? "Tú" : "Coach"}
                    </p>
                    <div className="whitespace-pre-wrap text-sm leading-6">{message.content}</div>
                  </article>
                  {linkedProposal && (
                    <ProposalCard
                      proposal={linkedProposal}
                      pending={proposalBusy === linkedProposal.id}
                      onAction={updateProposal}
                    />
                  )}
                </div>
              );
            })}

            {busy && (
              <div className="mb-4 mr-auto max-w-[95%] border-l-4 border-accent bg-surface px-4 py-4">
                <p className="font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-accent-press">
                  Coach
                </p>
                <div className="mt-3 flex gap-1.5" aria-label="Pensando">
                  {[0, 1, 2].map((dot) => (
                    <span key={dot} className="h-2 w-2 animate-pulse rounded-full bg-ink" style={{ animationDelay: `${dot * 160}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        </div>

        <form onSubmit={submit} className="border-t border-ink bg-surface p-3 sm:p-4">
          {error && (
            <div className="mb-3 border-l-4 border-danger bg-red-50 px-3 py-2 text-xs leading-5 text-danger">
              {error}
            </div>
          )}
          <div className="grid grid-cols-[1fr_auto] items-end gap-2">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value.slice(0, 2400))}
              onKeyDown={handleKeyDown}
              disabled={!apiReady || busy}
              rows={2}
              placeholder="Pregunta sobre tu rutina, técnica o progreso…"
              className="min-h-[58px] max-h-40 resize-y border border-border bg-bg-elev-0 px-3 py-3 text-[16px] leading-5 text-ink outline-none placeholder:text-ink-faint focus:border-signal focus:shadow-focusring disabled:opacity-55"
            />
            <button type="submit" className="button-primary h-[58px] min-w-[58px] px-4" disabled={!input.trim() || !apiReady || busy} aria-label="Enviar mensaje">
              <span className="text-lg">↑</span>
            </button>
          </div>
          <div className="mt-2 flex justify-between gap-3 font-mono text-[8px] uppercase tracking-[0.08em] text-ink-faint">
            <span>Enter envía · Shift+Enter salta línea</span>
            <span>{input.length}/2400</span>
          </div>
          <p className="mt-3 text-[10px] leading-4 text-ink-faint">
            El Coach puede equivocarse. No introduzcas datos personales o médicos sensibles. Dolor,
            lesión o síntomas extraños requieren valoración profesional.
          </p>
        </form>
      </section>
    </div>
  );
}
