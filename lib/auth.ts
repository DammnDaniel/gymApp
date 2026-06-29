import { createClient } from "@/lib/supabase/client";

const FN = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function callFn(path: string, body: unknown) {
  const res = await fetch(`${FN}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data } as { ok: boolean; data: any };
}

/** Registra un usuario nuevo (username + email + password). */
export async function signupRequest(
  username: string,
  email: string,
  password: string,
) {
  const { ok, data } = await callFn("signup", { username, email, password });
  if (!ok) throw new Error(data?.error || "No se pudo completar el registro");
  return data;
}

/** Inicia sesión por username y fija la sesión en el cliente (cookies). */
export async function loginRequest(username: string, password: string) {
  const { ok, data } = await callFn("login", { username, password });
  if (!ok || !data?.session) {
    throw new Error(data?.error || "Usuario o contraseña incorrectos");
  }
  const supabase = createClient();
  const { error } = await supabase.auth.setSession(data.session);
  if (error) throw new Error(error.message);
  return data;
}

/** Cierra la sesión. */
export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
}
