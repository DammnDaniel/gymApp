import OpenAI from "openai";

const DIRECT_MODEL = "gpt-5.6-terra";
const GATEWAY_MODEL = "openai/gpt-5.6-terra";
const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1";

function directModel(model?: string) {
  const selected = model?.trim() || DIRECT_MODEL;
  return selected.startsWith("openai/") ? selected.slice("openai/".length) : selected;
}

function gatewayModel(model?: string) {
  const selected = model?.trim() || GATEWAY_MODEL;
  return selected.includes("/") ? selected : `openai/${selected}`;
}

export function isCoachConfigured() {
  return Boolean(
    process.env.OPENAI_API_KEY?.trim() ||
      process.env.AI_GATEWAY_API_KEY?.trim() ||
      process.env.VERCEL_OIDC_TOKEN?.trim(),
  );
}

export function createCoachAI() {
  const openAIKey = process.env.OPENAI_API_KEY?.trim();
  if (openAIKey) {
    return {
      client: new OpenAI({ apiKey: openAIKey }),
      model: directModel(process.env.OPENAI_MODEL),
      provider: "openai" as const,
    };
  }

  const gatewayCredential =
    process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_OIDC_TOKEN?.trim();
  if (gatewayCredential) {
    return {
      client: new OpenAI({
        apiKey: gatewayCredential,
        baseURL: GATEWAY_URL,
      }),
      model: gatewayModel(process.env.AI_GATEWAY_MODEL || process.env.OPENAI_MODEL),
      provider: "vercel-ai-gateway" as const,
    };
  }

  return null;
}
