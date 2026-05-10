import Anthropic from "@anthropic-ai/sdk";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";
import { buildUserPrompt, SYSTEM_PROMPT } from "./prompt";
import { AiGenerationRequest, AiGenerationResult, AiProvider, ResumeContent } from "./types";

export class AnthropicProvider implements AiProvider {
  private client: Anthropic;
  private model: string;

  constructor() {
    if (!env.ANTHROPIC_API_KEY) {
      throw new AppError("ANTHROPIC_API_KEY is not configured", 500, "AI_CONFIG_ERROR");
    }
    this.client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    this.model = env.ANTHROPIC_MODEL;
  }

  async generate(req: AiGenerationRequest): Promise<AiGenerationResult> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      temperature: 0.3,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(req) }],
    });

    const text = message.content
      .map((c) => (c.type === "text" ? c.text : ""))
      .join("")
      .trim();

    if (!text) throw new AppError("AI returned no content", 502, "AI_EMPTY");
    const parsed = parseJson(text);
    return { content: parsed, provider: "anthropic", model: this.model };
  }
}

function parseJson(text: string): ResumeContent {
  const cleaned = text.trim().replace(/^```json\n?/, "").replace(/```$/, "");
  // try to find the first JSON object
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const candidate = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  try {
    return JSON.parse(candidate) as ResumeContent;
  } catch {
    throw new AppError("AI response was not valid JSON", 502, "AI_PARSE_ERROR");
  }
}
