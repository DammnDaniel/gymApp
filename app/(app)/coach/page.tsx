import { createClient } from "@/lib/supabase/server";
import { CoachChat } from "@/components/coach/CoachChat";
import { isCoachConfigured } from "@/lib/coach/ai";
import type {
  CoachMemory,
  CoachMessage,
  CoachProposal,
  CoachThread,
} from "@/lib/coach/types";

export default async function CoachPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: threads }, { data: memories }] = await Promise.all([
    supabase
      .from("coach_threads")
      .select("id, title, created_at, updated_at")
      .eq("owner_id", user!.id)
      .order("updated_at", { ascending: false })
      .limit(20),
    supabase
      .from("coach_memories")
      .select("id, category, content, created_at")
      .eq("owner_id", user!.id)
      .order("updated_at", { ascending: false })
      .limit(12),
  ]);

  const initialThread = threads?.[0] ?? null;
  let messages: CoachMessage[] = [];
  let proposals: CoachProposal[] = [];
  if (initialThread) {
    const [messageResult, proposalResult] = await Promise.all([
      supabase
        .from("coach_messages")
        .select("id, thread_id, role, content, metadata, created_at")
        .eq("thread_id", initialThread.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("routine_change_proposals")
        .select(
          "id, thread_id, routine_id, status, title, summary, operations, model, created_at, applied_at, undone_at",
        )
        .eq("thread_id", initialThread.id)
        .order("created_at", { ascending: true }),
    ]);
    messages = (messageResult.data ?? []) as CoachMessage[];
    proposals = (proposalResult.data ?? []) as CoachProposal[];
  }

  return (
    <CoachChat
      initialThreads={(threads ?? []) as CoachThread[]}
      initialThread={initialThread as CoachThread | null}
      initialMessages={messages}
      initialProposals={proposals}
      memories={(memories ?? []) as CoachMemory[]}
      apiReady={isCoachConfigured()}
    />
  );
}
