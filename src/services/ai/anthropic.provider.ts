import Anthropic from "@anthropic-ai/sdk";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";
import { ANTHROPIC_MODEL_API_ID } from "./models";
import {
  buildCoverLetterPrompt,
  buildUserPrompt,
  COVER_LETTER_SYSTEM_PROMPT,
  SYSTEM_PROMPT,
} from "./prompt";
import {
  AiGenerationRequest,
  AiGenerationResult,
  AiProvider,
  CoverLetterContent,
  CoverLetterRequest,
  CoverLetterResult,
  ResumeContent,
} from "./types";

export class AnthropicProvider implements AiProvider {
  private client: Anthropic;
  private model: string;
  private apiModel: string;

  constructor(model: string) {
    if (!env.ANTHROPIC_API_KEY) {
      throw new AppError("ANTHROPIC_API_KEY is not configured", 500, "AI_CONFIG_ERROR");
    }
    this.client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    this.model = model;
    this.apiModel = (ANTHROPIC_MODEL_API_ID as Record<string, string>)[model] ?? model;
  }

  async generate(req: AiGenerationRequest): Promise<AiGenerationResult> {
    const text = await this.call(SYSTEM_PROMPT, buildUserPrompt(req), 8192, 0.3);
    const parsed = parseJson<ResumeContent>(text);
    return { content: parsed, provider: "anthropic", model: this.model };
  }

  async generateCoverLetter(req: CoverLetterRequest): Promise<CoverLetterResult> {
    const text = await this.call(
      COVER_LETTER_SYSTEM_PROMPT,
      buildCoverLetterPrompt(req),
      2048,
      0.5
    );
    const parsed = parseJson<CoverLetterContent>(text);
    if (!parsed.text || typeof parsed.text !== "string") {
      throw new AppError("Cover letter response missing 'text' field", 502, "AI_PARSE_ERROR");
    }
    return { content: parsed, provider: "anthropic", model: this.model };
  }

  private async call(
    system: string,
    user: string,
    maxTokens: number,
    temperature: number
  ): Promise<string> {
    let message;
    try {
      message = await this.client.messages.create({
        model: this.apiModel,
        max_tokens: maxTokens,
        temperature,
        system,
        messages: [{ role: "user", content: user }],
      });
    } catch (err: unknown) {
      const detail = anthropicErrorDetail(err);
      throw new AppError(
        `Anthropic API call failed (model="${this.model}"): ${detail}`,
        502,
        "AI_REQUEST_FAILED"
      );
    }

    const text = message.content
      .map((c) => (c.type === "text" ? c.text : ""))
      .join("")
      .trim();

    if (!text) throw new AppError("AI returned no content", 502, "AI_EMPTY");
    return text;
  }
}

function anthropicErrorDetail(err: unknown): string {
  if (err && typeof err === "object") {
    const e = err as {
      status?: number;
      message?: string;
      error?: { message?: string };
      cause?: { code?: string; message?: string; errors?: Array<{ code?: string; address?: string }> };
    };
    const inner = e.error?.message ?? e.message;
    const cause = e.cause;
    const causeDetail = cause
      ? cause.errors?.length
        ? cause.errors.map((c) => `${c.code}:${c.address}`).join(" | ")
        : cause.code ?? cause.message
      : undefined;
    const parts = [
      e.status ? `[${e.status}]` : undefined,
      inner,
      causeDetail ? `(cause: ${causeDetail})` : undefined,
    ].filter(Boolean);
    if (parts.length) return parts.join(" ");
  }
  return String(err);
}

function parseJson<T>(text: string): T {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const candidate = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  try {
    return JSON.parse(candidate) as T;
  } catch {
    const preview = text.slice(0, 200).replace(/\s+/g, " ");
    throw new AppError(
      `AI response was not valid JSON (preview: "${preview}")`,
      502,
      "AI_PARSE_ERROR"
    );
  }
}
