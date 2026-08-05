import type { Tool } from "openai/resources/responses/responses";

const nullableString = { type: ["string", "null"] } as const;
const nullableInteger = { type: ["integer", "null"] } as const;

export const coachTools: Tool[] = [
  {
    type: "function",
    name: "get_routine_details",
    description:
      "Obtiene todos los días, ejercicios, series, repeticiones y notas de una rutina visible. Úsala antes de evaluar o modificar una rutina.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        routine_id: {
          type: "string",
          description: "UUID exacto de una rutina visible.",
        },
      },
      required: ["routine_id"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "search_exercises",
    description:
      "Busca ejercicios reales en la biblioteca y devuelve IDs válidos. Es obligatorio usarla antes de añadir o sustituir un ejercicio.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        query: {
          ...nullableString,
          description: "Nombre o término de búsqueda, por ejemplo peck deck o remo.",
        },
        muscle: {
          ...nullableString,
          description: "Músculo principal en inglés si se conoce; null si no se filtra.",
        },
        equipment: {
          ...nullableString,
          description: "Equipo o máquina; null si no se filtra.",
        },
        limit: { type: "integer", minimum: 1, maximum: 12 },
      },
      required: ["query", "muscle", "equipment", "limit"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "get_training_history",
    description:
      "Obtiene las sesiones recientes del usuario. Puede filtrarse por exercise_id para revisar cargas, repeticiones y RPE de un ejercicio.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        exercise_id: {
          ...nullableString,
          description: "UUID exacto de un ejercicio o null para sesiones generales.",
        },
        limit: { type: "integer", minimum: 1, maximum: 20 },
      },
      required: ["exercise_id", "limit"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "remember_training_context",
    description:
      "Guarda una preferencia estable expresada explícitamente por el usuario para recordarla en futuras conversaciones. No guardes deducciones ni diagnósticos.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: ["preference", "limitation", "goal", "equipment", "schedule"],
        },
        content: {
          type: "string",
          description: "Hecho breve y autosuficiente, sin datos médicos detallados.",
        },
      },
      required: ["category", "content"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "propose_routine_change",
    description:
      "Crea una propuesta revisable para una rutina propia. No aplica nada. Úsala únicamente cuando el usuario solicite o acepte claramente cambios de rutina.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        routine_id: {
          type: "string",
          description: "UUID exacto de la rutina propia que se cambiaría.",
        },
        title: { type: "string" },
        summary: {
          type: "string",
          description: "Resumen del cambio, lo que se conserva y su impacto.",
        },
        operations: {
          type: "array",
          minItems: 1,
          maxItems: 12,
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: [
                  "replace_exercise",
                  "add_exercise",
                  "remove_exercise",
                  "update_prescription",
                  "move_exercise",
                ],
              },
              routine_exercise_id: {
                ...nullableString,
                description:
                  "ID del elemento actual para sustituir, eliminar, editar o mover; null al añadir.",
              },
              day_id: {
                ...nullableString,
                description: "Día de destino para añadir o mover; null si no cambia de día.",
              },
              exercise_id: {
                ...nullableString,
                description:
                  "ID del ejercicio de biblioteca para añadir o sustituir; null en el resto.",
              },
              position: nullableInteger,
              target_sets: nullableInteger,
              target_reps_min: nullableInteger,
              target_reps_max: nullableInteger,
              notes: nullableString,
              reason: {
                type: "string",
                description: "Motivo concreto de esta operación.",
              },
            },
            required: [
              "type",
              "routine_exercise_id",
              "day_id",
              "exercise_id",
              "position",
              "target_sets",
              "target_reps_min",
              "target_reps_max",
              "notes",
              "reason",
            ],
            additionalProperties: false,
          },
        },
      },
      required: ["routine_id", "title", "summary", "operations"],
      additionalProperties: false,
    },
  },
];

