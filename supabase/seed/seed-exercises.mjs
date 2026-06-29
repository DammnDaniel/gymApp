// Seed del catálogo de ejercicios desde Free Exercise DB.
// Ejecutar una vez:  node supabase/seed/seed-exercises.mjs
// Usa SUPABASE_SERVICE_ROLE_KEY (lee .env.local). Idempotente (upsert por slug).
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

function parseEnv(file) {
  const out = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

const SRC =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const IMG_BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

const env = parseEnv(".env.local");
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

console.log("Descargando catálogo…");
const res = await fetch(SRC);
if (!res.ok) {
  console.error("No se pudo descargar el catálogo:", res.status);
  process.exit(1);
}
const data = await res.json();
console.log(`${data.length} ejercicios en el origen.`);

const rows = data.map((e) => ({
  slug: e.id,
  name: e.name,
  force: e.force ?? null,
  level: e.level ?? null,
  mechanic: e.mechanic ?? null,
  equipment: e.equipment ?? null,
  primary_muscles: e.primaryMuscles ?? [],
  secondary_muscles: e.secondaryMuscles ?? [],
  instructions: e.instructions ?? [],
  category: e.category ?? null,
  image_start: e.images?.[0] ? IMG_BASE + e.images[0] : null,
  image_end: e.images?.[1] ? IMG_BASE + e.images[1] : null,
  is_custom: false,
  owner_id: null,
}));

const CHUNK = 200;
let done = 0;
for (let i = 0; i < rows.length; i += CHUNK) {
  const batch = rows.slice(i, i + CHUNK);
  const { error } = await supabase
    .from("exercises")
    .upsert(batch, { onConflict: "slug" });
  if (error) {
    console.error(`Error en el lote ${i}-${i + batch.length}:`, error.message);
    process.exit(1);
  }
  done += batch.length;
  console.log(`Insertados/actualizados ${done}/${rows.length}`);
}

console.log("\n==> Catálogo sembrado ✓");
