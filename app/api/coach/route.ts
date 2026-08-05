import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { createClient } from "@/lib/supabase/server";
import { createCoachAI } from "@/lib/coach/ai";
import { buildCoachInstructions } from "@/lib/coach/prompt";
import { coachTools } from "@/lib/coach/openai-tools";
import {
  createRoutineProposal,
  getCoachMemories,
  getRoutineDetails,
  getRoutineSummaries,
  getTrainingHistory,
  rememberTrainingContext,
  searchExercises,
} from "@/lib/coach/server";
import type {
  CoachMemory,
  CoachOperation,
  CoachProposal,
} from "@/lib/coach/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_MESSAGE_LENGTH = 2400;
const MAX_MESSAGES_PER_MINUTE = 6;
const MAX_MESSAGES_PER_DAY = 30;

function asErrorMessage(error: unknown) {
  if (error instanceof OpenAI.APIError) {
    if (error.status === 401)
      return "La clave gratuita de Gemini no es válida o ha caducado.";
    if (error.status === 429)
      return "Se ha alcanzado la cuota gratuita de Gemini. No se ha generado ningún cargo; inténtalo más tarde.";
    return "Gemini no ha podido completar la respuesta.";
  }
  if (error instanceof Error) return error.message;
  return "No se ha podido completar la consulta.";
}

function asErrorStatus(error: unknown) {
  if (error instanceof OpenAI.APIError && error.status === 429) return 429;
  return 500;
}

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return { supabase, user: null };
  return { supabase, user };
}

export async function GET(request: Request) {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: "Sesión expirada" }, { status: 401 });

  const threadId = new URL(request.url).searchParams.get("thread_id");
  if (!threadId) {
    return NextResponse.json({ error: "Falta la conversación" }, { status: 400 });
  }

  const { data: thread } = await supabase
    .from("coach_threads")
    .select("id, title, created_at, updated_at")
    .eq("id", threadId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!thread) return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 });

  const [{ data: messages, error: messageError }, { data: proposals, error: proposalError }] =
    await Promise.all([
      supabase
        .from("coach_messages")
        .select("id, thread_id, role, content, metadata, created_at")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true }),
      supabase
        .from("routine_change_proposals")
        .select(
          "id, thread_id, routine_id, status, title, summary, operations, model, created_at, applied_at, undone_at",
        )
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true }),
    ]);
  if (messageError || proposalError) {
    return NextResponse.json({ error: "No se pudo cargar la conversación" }, { status: 500 });
  }
  return NextResponse.json({ thread, messages: messages ?? [], proposals: proposals ?? [] });
}

export async function POST(request: Request) {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: "Sesión expirada" }, { status: 401 });

  const ai = createCoachAI();
  if (!ai) {
    return NextResponse.json(
      { error: "El Coach todavía no tiene configurada una conexión de IA." },
      { status: 503 },
    );
  }

  let payload: { message?: unknown; thread_id?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud no válida" }, { status: 400 });
  }

  const message = typeof payload.message === "string" ? payload.message.trim() : "";
  const requestedThreadId =
    typeof payload.thread_id === "string" ? payload.thread_id : null;
  if (!message) return NextResponse.json({ error: "Escribe una pregunta" }, { status: 400 });
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `El mensaje no puede superar ${MAX_MESSAGE_LENGTH} caracteres.` },
      { status: 400 },
    );
  }

  const minuteAgo = new Date(Date.now() - 60_000).toISOString();
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
  const [{ count: minuteCount }, { count: dayCount }] = await Promise.all([
    supabase
      .from("coach_messages")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .eq("role", "user")
      .gte("created_at", minuteAgo),
    supabase
      .from("coach_messages")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .eq("role", "user")
      .gte("created_at", dayAgo),
  ]);
  if ((minuteCount ?? 0) >= MAX_MESSAGES_PER_MINUTE) {
    return NextResponse.json(
      { error: "Has enviado demasiados mensajes seguidos. Espera un poco antes de continuar." },
      { status: 429 },
    );
  }
  if ((dayCount ?? 0) >= MAX_MESSAGES_PER_DAY) {
    return NextResponse.json(
      { error: "Has alcanzado el límite gratuito diario del Coach. Podrás continuar mañana." },
      { status: 429 },
    );
  }

  let thread: { id: string; title: string; created_at: string; updated_at: string } | null = null;
  if (requestedThreadId) {
    const { data } = await supabase
      .from("coach_threads")
      .select("id, title, created_at, updated_at")
      .eq("id", requestedThreadId)
      .eq("owner_id", user.id)
      .maybeSingle();
    thread = data;
    if (!thread) {
      return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 });
    }
  } else {
    const title = message.replace(/\s+/g, " ").slice(0, 72);
    const { data, error } = await supabase
      .from("coach_threads")
      .insert({ owner_id: user.id, title })
      .select("id, title, created_at, updated_at")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    thread = data;
  }

  const now = new Date().toISOString();
  const { data: storedUserMessage, error: insertMessageError } = await supabase
    .from("coach_messages")
    .insert({
      thread_id: thread.id,
      owner_id: user.id,
      role: "user",
      content: message,
    })
    .select("id, thread_id, role, content, metadata, created_at")
    .single();
  if (insertMessageError) {
    return NextResponse.json({ error: insertMessageError.message }, { status: 500 });
  }
  await supabase.from("coach_threads").update({ updated_at: now }).eq("id", thread.id);

  try {
    const [profileResult, routines, memories, historyResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("display_name, username")
        .eq("id", user.id)
        .single(),
      getRoutineSummaries(supabase, user.id),
      getCoachMemories(supabase, user.id),
      supabase
        .from("coach_messages")
        .select("role, content, created_at")
        .eq("thread_id", thread.id)
        .order("created_at", { ascending: false })
        .limit(18),
    ]);

    const profile = profileResult.data;
    const history = [...(historyResult.data ?? [])].reverse();
    const instructions = buildCoachInstructions({
      userId: user.id,
      displayName: profile?.display_name || profile?.username || "Atleta",
      routines,
      memories,
    });
    const { client: gemini, model, provider } = ai;
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: instructions },
      ...history.map((item: any) => ({
        role: item.role as "user" | "assistant",
        content: item.content,
      })),
    ];

    let createdProposal: CoachProposal | null = null;
    let response = await gemini.chat.completions.create({
      model,
      messages,
      tools: coachTools,
      tool_choice: "auto",
      reasoning_effort: "low",
      max_completion_tokens: 1600,
    });

    for (let round = 0; round < 5; round += 1) {
      const assistant = response.choices[0]?.message;
      const calls = assistant?.tool_calls ?? [];
      if (!calls.length) break;

      messages.push(assistant);
      for (const call of calls) {
        let result: unknown;
        try {
          if (call.type !== "function") throw new Error("Herramienta no admitida");
          const args = JSON.parse(call.function.arguments);
          const toolName = call.function.name;
          if (toolName === "get_routine_details") {
            const routine = await getRoutineDetails(supabase, args.routine_id);
            result = routine ?? { error: "Rutina no encontrada o no visible" };
          } else if (toolName === "search_exercises") {
            result = await searchExercises(supabase, args);
          } else if (toolName === "get_training_history") {
            result = await getTrainingHistory(supabase, user.id, args);
          } else if (toolName === "remember_training_context") {
            result = await rememberTrainingContext(supabase, user.id, {
              category: args.category as CoachMemory["category"],
              content: args.content,
            });
          } else if (toolName === "propose_routine_change") {
            if (createdProposal) {
              result = {
                error: "Ya se creó una propuesta en esta respuesta. Explica esa propuesta.",
              };
            } else {
              createdProposal = await createRoutineProposal(supabase, {
                userId: user.id,
                threadId: thread.id,
                model,
                routine_id: args.routine_id,
                title: args.title,
                summary: args.summary,
                operations: args.operations as CoachOperation[],
              });
              result = {
                success: true,
                proposal_id: createdProposal.id,
                message: "Propuesta guardada. Aclara que todavía necesita confirmación.",
              };
            }
          } else {
            result = { error: "Herramienta no admitida" };
          }
        } catch (toolError) {
          result = { error: asErrorMessage(toolError) };
        }

        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }

      response = await gemini.chat.completions.create({
        model,
        messages,
        tools: coachTools,
        tool_choice: "auto",
        reasoning_effort: "low",
        max_completion_tokens: 1600,
      });
    }

    const unresolvedAssistant = response.choices[0]?.message;
    const unresolvedCalls = unresolvedAssistant?.tool_calls ?? [];
    if (unresolvedCalls.length) {
      messages.push(unresolvedAssistant);
      for (const call of unresolvedCalls) {
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify({
            error: "Límite interno de consultas alcanzado. Resume lo comprobado sin inventar datos.",
          }),
        });
      }
      messages.push({
        role: "system",
        content: "Finaliza ahora con una respuesta útil y breve. No solicites más herramientas.",
      });
      response = await gemini.chat.completions.create({
        model,
        messages,
        reasoning_effort: "low",
        max_completion_tokens: 1600,
      });
    }

    const answer =
      response.choices[0]?.message.content?.trim() ||
      "No he podido construir una respuesta fiable con los datos disponibles.";
    const { data: assistantMessage, error: assistantError } = await supabase
      .from("coach_messages")
      .insert({
        thread_id: thread.id,
        owner_id: user.id,
        role: "assistant",
        content: answer,
        metadata: {
          response_id: response.id,
          model,
          provider,
          proposal_id: createdProposal?.id ?? null,
        },
      })
      .select("id, thread_id, role, content, metadata, created_at")
      .single();
    if (assistantError) throw assistantError;

    return NextResponse.json({
      thread,
      message: assistantMessage,
      proposal: createdProposal,
      memories: await getCoachMemories(supabase, user.id),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: asErrorMessage(error),
        thread,
        message: storedUserMessage,
      },
      { status: asErrorStatus(error) },
    );
  }
}
