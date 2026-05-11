export const AI_PROVIDERS = ["openai", "anthropic"] as const;
export type AiProviderName = (typeof AI_PROVIDERS)[number];

/**
 * Display IDs used in the UI + DB. The Anthropic provider maps these to the
 * dated model IDs the API actually accepts (see ANTHROPIC_MODEL_API_ID below).
 * OpenAI accepts these IDs directly.
 */
export const AI_MODELS = {
  openai: ["gpt-5", "gpt-5-mini", "gpt-5-nano", "gpt-4o", "gpt-4o-mini"],
  anthropic: ["claude-opus-4-7", "claude-sonnet-4-6", "claude-haiku-4-5"],
} as const satisfies Record<AiProviderName, readonly string[]>;

/**
 * Display ID → dated API ID. Anthropic's API requires the dated suffix.
 */
export const ANTHROPIC_MODEL_API_ID: Record<(typeof AI_MODELS)["anthropic"][number], string> = {
  "claude-opus-4-7": "claude-opus-4-7",
  "claude-sonnet-4-6": "claude-sonnet-4-6",
  "claude-haiku-4-5": "claude-haiku-4-5-20251001",
};

/**
 * OpenAI GPT-5 reasoning models reject any non-default `temperature` value
 * (they only accept the default of 1). Don't send `temperature` for them.
 */
export const OPENAI_TEMPERATURE_LOCKED = new Set<string>(["gpt-5", "gpt-5-mini", "gpt-5-nano"]);

export function isValidModel(provider: AiProviderName, model: string): boolean {
  return (AI_MODELS[provider] as readonly string[]).includes(model);
}
