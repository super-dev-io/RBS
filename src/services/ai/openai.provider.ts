import OpenAI from "openai";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";
import { buildUserPrompt, SYSTEM_PROMPT } from "./prompt";
import { AiGenerationRequest, AiGenerationResult, AiProvider, ResumeContent } from "./types";

export class OpenAiProvider implements AiProvider {
  private client: OpenAI;
  private model: string;

  constructor() {
    if (!env.OPENAI_API_KEY) {
      throw new AppError("OPENAI_API_KEY is not configured", 500, "AI_CONFIG_ERROR");
    }
    this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    this.model = env.OPENAI_MODEL;
  }

  async generate(req: AiGenerationRequest): Promise<AiGenerationResult> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(req) },
      ],
    });

    const text = completion.choices[0]?.message?.content;
    if (!text) throw new AppError("AI returned no content", 502, "AI_EMPTY");
    const parsed = parseJson(text);
    return { content: parsed, provider: "openai", model: this.model };
  }
}

function parseJson(text: string): ResumeContent {
  const cleaned = text.trim().replace(/^```json\n?/, "").replace(/```$/, "");
  try {
    return JSON.parse(cleaned) as ResumeContent;
  } catch {
    throw new AppError("AI response was not valid JSON", 502, "AI_PARSE_ERROR");
  }
}
