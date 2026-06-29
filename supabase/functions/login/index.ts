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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { username, password } = await req.json();
    if (!username || !password)
      return json({ error: "Faltan campos" }, 400);

    // resolvemos el email a partir del username con service_role (el email
    // nunca se expone al cliente)
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: prof } = await admin
      .from("profiles")
      .select("email")
      .ilike("username", username)
      .maybeSingle();
    if (!prof?.email)
      return json({ error: "Usuario o contraseña incorrectos" }, 401);

    // signInWithPassword en el servidor con la anon key
    const anon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const { data, error } = await anon.auth.signInWithPassword({
      email: prof.email,
      password,
    });
    if (error || !data.session)
      return json({ error: "Usuario o contraseña incorrectos" }, 401);

    return json({
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
