import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const PRODUCTION_APP_URL = "https://gym-app-beta-flax.vercel.app";
const allowedOrigins = new Set([
  PRODUCTION_APP_URL,
  "http://localhost:3000",
  ...(Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean),
]);

function corsHeaders(origin: string | null) {
  const allowedOrigin =
    origin && allowedOrigins.has(origin) ? origin : PRODUCTION_APP_URL;
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "content-type, apikey",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

const genericResponse = {
  ok: true,
  message: "Si el usuario existe, recibirá un enlace de recuperación.",
};

Deno.serve(async (request) => {
  const origin = request.headers.get("origin");
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) });
  }
  if (request.method !== "POST") {
    return json({ error: "Método no permitido" }, 405, origin);
  }
  if (origin && !allowedOrigins.has(origin)) {
    return json({ error: "Origen no permitido" }, 403, origin);
  }

  try {
    const payload = await request.json().catch(() => null);
    const username =
      typeof payload?.username === "string" ? payload.username.trim() : "";

    if (!/^[a-zA-Z0-9_.]{3,20}$/.test(username)) {
      return json(genericResponse, 200, origin);
    }

    const url = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !serviceRoleKey || !anonKey) {
      console.error("password-reset: faltan variables de Supabase");
      return json({ error: "Servicio no disponible" }, 503, origin);
    }

    const admin = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("email")
      .ilike("username", username)
      .maybeSingle();

    if (profileError) {
      console.error(
        "password-reset: error al buscar el perfil",
        profileError.code,
      );
      return json({ error: "Servicio no disponible" }, 503, origin);
    }
    if (!profile?.email) {
      return json(genericResponse, 200, origin);
    }

    const auth = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const appUrl = (Deno.env.get("APP_URL") ?? PRODUCTION_APP_URL).replace(
      /\/$/,
      "",
    );
    const { error: resetError } = await auth.auth.resetPasswordForEmail(
      profile.email,
      { redirectTo: `${appUrl}/update-password` },
    );

    if (resetError) {
      console.error(
        "password-reset: Supabase Auth rechazó la solicitud",
        resetError.code ?? resetError.status,
      );
    }

    // Respuesta idéntica exista o no el usuario: evita enumerar cuentas.
    return json(genericResponse, 200, origin);
  } catch (error) {
    console.error(
      "password-reset: error inesperado",
      error instanceof Error ? error.name : "unknown",
    );
    return json({ error: "Servicio no disponible" }, 503, origin);
  }
});
