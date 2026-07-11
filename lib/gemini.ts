// Gemini client + one helper: structured output validated with Zod at the
// boundary (CLAUDE.md convention — Zod on every LLM output).

import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

export const GEMINI_MODEL = "gemini-3.5-flash";

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export function hasGemini(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

function client(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new ConfigError("GEMINI_API_KEY is not set");
  return new GoogleGenAI({ apiKey });
}

export type GeminiPart =
  | { type: "text"; text: string }
  | { type: "image"; data: string; mime_type: string };

export async function generateStructured<S extends z.ZodType>(
  schema: S,
  parts: GeminiPart[],
  systemInstruction?: string,
): Promise<z.infer<S>> {
  const interaction = await client().interactions.create({
    model: GEMINI_MODEL,
    input: parts,
    system_instruction: systemInstruction,
    response_format: {
      type: "text",
      mime_type: "application/json",
      schema: z.toJSONSchema(schema),
    },
  });
  const text = interaction.output_text;
  if (!text) throw new Error("Gemini returned no output_text");
  return schema.parse(JSON.parse(text));
}
