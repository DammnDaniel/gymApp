import OpenAI from "openai";

const GEMINI_MODEL = "gemini-3.5-flash";
const GEMINI_OPENAI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";

export function isCoachConfigured() {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export function createCoachAI() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;

  return {
    client: new OpenAI({ apiKey, baseURL: GEMINI_OPENAI_URL }),
    model: process.env.GEMINI_MODEL?.trim() || GEMINI_MODEL,
    provider: "google-gemini-free" as const,
  };
}
