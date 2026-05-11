import OpenAI from "openai";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";
import { OPENAI_TEMPERATURE_LOCKED } from "./models";
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

export class OpenAiProvider implements AiProvider {
  private client: OpenAI;
  private model: string;
  private supportsTemperature: boolean;

  constructor(model: string) {
    if (!env.OPENAI_API_KEY) {
      throw new AppError("OPENAI_API_KEY is not configured", 500, "AI_CONFIG_ERROR");
    }
    this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    this.model = model;
    this.supportsTemperature = !OPENAI_TEMPERATURE_LOCKED.has(model);
  }

  async generate(req: AiGenerationRequest): Promise<AiGenerationResult> {
    const text = await this.call(SYSTEM_PROMPT, buildUserPrompt(req), 0.3);
    const parsed = parseJson<ResumeContent>(text);
    return { content: parsed, provider: "openai", model: this.model };
  }

  async generateCoverLetter(req: CoverLetterRequest): Promise<CoverLetterResult> {
    const text = await this.call(
      COVER_LETTER_SYSTEM_PROMPT,
      buildCoverLetterPrompt(req),
      0.5
    );
    const parsed = parseJson<CoverLetterContent>(text);
    if (!parsed.text || typeof parsed.text !== "string") {
      throw new AppError("Cover letter response missing 'text' field", 502, "AI_PARSE_ERROR");
    }
    return { content: parsed, provider: "openai", model: this.model };
  }

  private async call(system: string, user: string, temperature: number): Promise<string> {
    const params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
      model: this.model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    };
    if (this.supportsTemperature) params.temperature = temperature;

    let completion: OpenAI.Chat.ChatCompletion;
    try {
      completion = await this.client.chat.completions.create(params);
    } catch (err: unknown) {
      const detail = openaiErrorDetail(err);
      throw new AppError(
        `OpenAI API call failed (model="${this.model}"): ${detail}`,
        502,
        "AI_REQUEST_FAILED"
      );
    }

    const text = completion.choices[0]?.message?.content;
    if (!text) throw new AppError("AI returned no content", 502, "AI_EMPTY");
    return text;
  }
}

function openaiErrorDetail(err: unknown): string {
  if (err && typeof err === "object") {
    const e = err as {
      status?: number;
      message?: string;
      code?: string;
      error?: { message?: string; code?: string };
      cause?: { code?: string; message?: string; errors?: Array<{ code?: string; address?: string }> };
    };
    const inner = e.error?.message ?? e.message;
    const code = e.error?.code ?? e.code;
    const cause = e.cause;
    const causeDetail = cause
      ? cause.errors?.length
        ? cause.errors.map((c) => `${c.code}:${c.address}`).join(" | ")
        : cause.code ?? cause.message
      : undefined;
    if (inner) {
      const prefix = e.status ? `[${e.status}] ` : "";
      const main = code ? `${prefix}${code}: ${inner}` : `${prefix}${inner}`;
      return causeDetail ? `${main} (cause: ${causeDetail})` : main;
    }
  }
  return String(err);
}

function parseJson<T>(text: string): T {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const preview = text.slice(0, 200).replace(/\s+/g, " ");
    throw new AppError(
      `AI response was not valid JSON (preview: "${preview}")`,
      502,
      "AI_PARSE_ERROR"
    );
  }
}
