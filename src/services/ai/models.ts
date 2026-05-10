export const AI_PROVIDERS = ["openai", "anthropic"] as const;
export type AiProviderName = (typeof AI_PROVIDERS)[number];

export const AI_MODELS = {
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"],
  anthropic: ["claude-sonnet-4-6", "claude-haiku-4-5", "claude-opus-4-7"],
} as const satisfies Record<AiProviderName, readonly string[]>;

export function isValidModel(provider: AiProviderName, model: string): boolean {
  return (AI_MODELS[provider] as readonly string[]).includes(model);
}
