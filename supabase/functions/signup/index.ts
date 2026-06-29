import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { ...cors, "Content-Type": "application/json" },
  });

// ── REGISTRO CERRADO ────────────────────────────────────────────────
// Los 2 perfiles ya están dados de alta. Para REABRIR el registro:
// pon REGISTRATION_OPEN = true y vuelve a desplegar (npm run deploy o CLI).
const REGISTRATION_OPEN = false;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (!REGISTRATION_OPEN) return json({ error: "El registro está cerrado." }, 403);
  try {
    const { username, email, password } = await req.json();
    if (!username || !email || !password)
      return json({ error: "Faltan campos" }, 400);
    if (!/^[a-zA-Z0-9_.]{3,20}$/.test(username))
      return json({ error: "Usuario inválido (3-20, letras/números/_/.)" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ¿username libre? (citext => case-insensitive)
    const { data: taken } = await admin
      .from("profiles")
      .select("id")
      .ilike("username", username)
      .maybeSingle();
    if (taken) return json({ error: "Ese nombre de usuario ya existe" }, 409);

    // email_confirm: true => usuario activo al instante, sin verificación.
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username },
    });
    if (error) return json({ error: error.message }, 400);

    const { error: pErr } = await admin.from("profiles").insert({
      id: created.user!.id,
      username,
      email,
      display_name: username,
    });
    if (pErr) {
      // rollback del usuario de Auth si falla la fila de perfil
      await admin.auth.admin.deleteUser(created.user!.id);
      return json({ error: pErr.message }, 400);
    }

    return json({ ok: true });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
