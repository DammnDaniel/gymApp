export type CoachRole = "user" | "assistant";

export type CoachThread = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type CoachMessage = {
  id: string;
  thread_id: string;
  role: CoachRole;
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
};

export type CoachOperationType =
  | "replace_exercise"
  | "add_exercise"
  | "remove_exercise"
  | "update_prescription"
  | "move_exercise";

export type CoachOperation = {
  type: CoachOperationType;
  routine_exercise_id: string | null;
  day_id: string | null;
  exercise_id: string | null;
  position: number | null;
  target_sets: number | null;
  target_reps_min: number | null;
  target_reps_max: number | null;
  notes: string | null;
  reason: string;
  current_exercise_name?: string;
  exercise_name?: string;
  day_name?: string;
};

export type CoachProposalStatus =
  | "pending"
  | "applied"
  | "rejected"
  | "undone";

export type CoachProposal = {
  id: string;
  thread_id: string;
  routine_id: string;
  status: CoachProposalStatus;
  title: string;
  summary: string;
  operations: CoachOperation[];
  model: string | null;
  created_at: string;
  applied_at: string | null;
  undone_at: string | null;
};

export type CoachMemory = {
  id: string;
  category: "preference" | "limitation" | "goal" | "equipment" | "schedule";
  content: string;
  created_at: string;
};

