import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sesión expirada" }, { status: 401 });

  let action: "apply" | "reject" | "undo";
  try {
    const body = await request.json();
    action = body.action;
  } catch {
    return NextResponse.json({ error: "Solicitud no válida" }, { status: 400 });
  }

  try {
    if (action === "apply") {
      const { error } = await supabase.rpc("apply_coach_routine_proposal", {
        p_proposal_id: params.id,
      });
      if (error) throw error;
    } else if (action === "undo") {
      const { error } = await supabase.rpc("undo_coach_routine_proposal", {
        p_proposal_id: params.id,
      });
      if (error) throw error;
    } else if (action === "reject") {
      const { data, error } = await supabase
        .from("routine_change_proposals")
        .update({ status: "rejected" })
        .eq("id", params.id)
        .eq("owner_id", user.id)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("La propuesta ya no está pendiente");
    } else {
      return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    }

    const { data: proposal, error } = await supabase
      .from("routine_change_proposals")
      .select(
        "id, thread_id, routine_id, status, title, summary, operations, model, created_at, applied_at, undone_at",
      )
      .eq("id", params.id)
      .eq("owner_id", user.id)
      .single();
    if (error) throw error;
    return NextResponse.json({ proposal });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo actualizar la rutina" },
      { status: 400 },
    );
  }
}

