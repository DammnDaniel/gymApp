# GymApp
PWA de entrenamiento, 2 perfiles. Login por usuario+contraseña (email en registro).
Registro de series, biblioteca, edición de rutinas, progreso con gráficos.

## Stack
Next.js (App Router, TS) · Tailwind · Supabase (Postgres+Auth+RLS+Storage+Functions)
· TanStack Query · Recharts · Serwist (PWA) · Vercel.

## Convenciones
- Server Components por defecto; "use client" solo donde haya interactividad.
- Datos vía hooks en lib/queries con TanStack Query; nada de fetch suelto en UI.
- IDs en cliente (uuid) para que el modo offline sincronice sin colisiones.
- Toda tabla nace con RLS y sus policies en la misma migración.
- Internamente kg; convertir solo al presentar según profiles.unit_system.
- service_role SOLO en Edge Functions / scripts server. Nunca en el cliente.

## Comandos
- npm run dev / build / lint
- npm run db:types          -> regenera tipos de Supabase
- npm run db:seed:exercises
- npm run db:seed:routines

## Auth
Login por username vía Edge Function (resuelve email + signInWithPassword server-side).
