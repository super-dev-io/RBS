import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";
import { AnthropicProvider } from "./anthropic.provider";
import { OpenAiProvider } from "./openai.provider";
import { AI_MODELS, AiProviderName, isValidModel } from "./models";
import { AiProvider } from "./types";

const cache = new Map<string, AiProvider>();
const MAX_CACHE = 16;

function build(provider: AiProviderName, model: string): AiProvider {
  switch (provider) {
    case "anthropic":
      return new AnthropicProvider(model);
    case "openai":
      return new OpenAiProvider(model);
  }
}

export function resolveProviderAndModel(opts: {
  provider?: string | null;
  model?: string | null;
}): { provider: AiProviderName; model: string } {
  const provider = (opts.provider ?? env.AI_PROVIDER) as AiProviderName;
  if (!AI_MODELS[provider]) {
    throw new AppError(`Unknown AI provider: ${provider}`, 500, "AI_CONFIG_ERROR");
  }
  const fallbackModel = provider === "openai" ? env.OPENAI_MODEL : env.ANTHROPIC_MODEL;
  const model = opts.model ?? fallbackModel;
  if (!isValidModel(provider, model)) {
    throw new AppError(
      `Model "${model}" is not valid for provider "${provider}"`,
      400,
      "AI_INVALID_MODEL"
    );
  }
  return { provider, model };
}

export function getAiProvider(opts: {
  provider?: string | null;
  model?: string | null;
}): AiProvider {
  const { provider, model } = resolveProviderAndModel(opts);
  const key = `${provider}:${model}`;
  let inst = cache.get(key);
  if (!inst) {
    inst = build(provider, model);
    cache.set(key, inst);
    if (cache.size > MAX_CACHE) {
      const oldest = cache.keys().next().value as string | undefined;
      if (oldest) cache.delete(oldest);
    }
  }
  return inst;
}

export type { AiProvider, AiGenerationRequest, AiGenerationResult, ResumeContent } from "./types";
export { AI_MODELS, AI_PROVIDERS } from "./models";
export type { AiProviderName } from "./models";
