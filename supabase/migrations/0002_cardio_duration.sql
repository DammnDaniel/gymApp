-- Cardio: permitir registrar duración por serie (minutos -> segundos).
-- set_logs ya tiene RLS ("own set_logs"); cubre esta columna (RLS es por fila).
alter table set_logs add column if not exists duration_seconds int;
