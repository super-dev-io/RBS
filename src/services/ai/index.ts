import { env } from "../../config/env";
import { AnthropicProvider } from "./anthropic.provider";
import { OpenAiProvider } from "./openai.provider";
import { AiProvider } from "./types";

let instance: AiProvider | null = null;

export function getAiProvider(): AiProvider {
  if (instance) return instance;
  switch (env.AI_PROVIDER) {
    case "anthropic":
      instance = new AnthropicProvider();
      break;
    case "openai":
    default:
      instance = new OpenAiProvider();
      break;
  }
  return instance;
}

export type { AiProvider, AiGenerationRequest, AiGenerationResult, ResumeContent } from "./types";
