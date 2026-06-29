# GymApp

PWA de entrenamiento para 2 perfiles. Login por usuario + contraseña (email en
registro). Biblioteca de ejercicios, edición de rutinas, registro de series y
progreso con gráficos. Datos en la nube (Supabase) y modo offline (PWA).

## Stack

Next.js 13.5 (App Router, TS) · Tailwind 3 · Supabase (Postgres + Auth + RLS +
Storage + Edge Functions) · TanStack Query · Recharts (Fase 5) · Serwist (Fase 6)
· Vercel.

> **Nota de versiones.** El proyecto está fijado a **Next 13.5 / React 18 /
> Tailwind 3** porque el equipo de desarrollo corre **Node 18.12.1** (sin permisos
> de admin para actualizar). Next 14 exige Node ≥18.17 y Next 15 ≥18.18. Cuando se
> migre a un equipo con **Node ≥20**, subir a Next 15 + Tailwind 4 es directo
> (`npm i next@latest react@latest react-dom@latest`, ajustar `cookies()` a async
> en `lib/supabase/server.ts` y migrar Tailwind a la config CSS-first).

## Desarrollo local

```bash
npm install
npm run dev          # http://localhost:3000
```

Copia `.env.example` a `.env.local` y rellena las credenciales de Supabase
(ver sección 1 del encargo). Sin credenciales, la app arranca pero la auth no
funciona todavía (eso llega en la Fase 1).

## Variables de entorno

| Variable | Dónde se consigue | Secreta |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role | **Sí** |

## Despliegue (Vercel)

1. Crea el repo `gymapp` en GitHub y haz push (`git remote add origin … && git push -u origin main`).
2. En Vercel: *Add New → Project* → importa `gymapp`.
3. *Settings → Environment Variables*: añade `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`.
4. Cada `git push` republica solo.

## Estructura

```
app/                 # rutas (App Router)
components/           # UI reutilizable
lib/supabase/         # clients browser/server
lib/queries/          # hooks TanStack Query (Fase 1+)
supabase/             # migraciones, Edge Functions, seeds (Fase 1+)
```
