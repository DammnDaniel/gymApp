// Traducción de la taxonomía de Free Exercise DB (inglés) a español.
// Los valores en BD siguen en inglés (para filtrar); solo se traduce al mostrar.

const MUSCLES: Record<string, string> = {
  abdominals: "Abdominales",
  abductors: "Abductores",
  adductors: "Aductores",
  biceps: "Bíceps",
  calves: "Gemelos",
  chest: "Pecho",
  forearms: "Antebrazos",
  glutes: "Glúteos",
  hamstrings: "Isquiotibiales",
  lats: "Dorsales",
  "lower back": "Lumbares",
  "middle back": "Espalda media",
  neck: "Cuello",
  quadriceps: "Cuádriceps",
  shoulders: "Hombros",
  traps: "Trapecio",
  triceps: "Tríceps",
};

const EQUIPMENT: Record<string, string> = {
  barbell: "Barra",
  dumbbell: "Mancuerna",
  cable: "Polea",
  machine: "Máquina",
  "body only": "Peso corporal",
  kettlebells: "Kettlebell",
  bands: "Bandas",
  "exercise ball": "Fitball",
  "medicine ball": "Balón medicinal",
  "e-z curl bar": "Barra Z",
  "foam roll": "Foam roller",
  other: "Otro",
};

const LEVEL: Record<string, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  expert: "Avanzado",
};

const CATEGORY: Record<string, string> = {
  strength: "Fuerza",
  stretching: "Estiramiento",
  plyometrics: "Pliometría",
  strongman: "Strongman",
  powerlifting: "Powerlifting",
  cardio: "Cardio",
  "olympic weightlifting": "Halterofilia",
};

const FORCE: Record<string, string> = {
  pull: "Tirón",
  push: "Empuje",
  static: "Estático",
};

const MECHANIC: Record<string, string> = {
  compound: "Compuesto",
  isolation: "Aislamiento",
};

function tr(map: Record<string, string>, v: string | null | undefined) {
  if (!v) return "";
  return map[v.toLowerCase()] ?? v;
}

export const esMuscle = (v?: string | null) => tr(MUSCLES, v);
export const esEquipment = (v?: string | null) => tr(EQUIPMENT, v);
export const esLevel = (v?: string | null) => tr(LEVEL, v);
export const esCategory = (v?: string | null) => tr(CATEGORY, v);
export const esForce = (v?: string | null) => tr(FORCE, v);
export const esMechanic = (v?: string | null) => tr(MECHANIC, v);

// Listas para los filtros (valor en inglés -> etiqueta ES)
export const MUSCLE_OPTIONS = Object.entries(MUSCLES).map(([value, label]) => ({
  value,
  label,
}));
export const EQUIPMENT_OPTIONS = Object.entries(EQUIPMENT).map(
  ([value, label]) => ({ value, label }),
);
