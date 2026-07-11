// Submission ingestion: image -> Gemini vision -> structured, Zod-validated
// findings. The output is injected verbatim into the agent's revision context.

import { generateStructured } from "@/lib/gemini";
import {
  SubmissionAnalysisSchema,
  type ColorStats,
  type Persona,
  type SubmissionAnalysis,
} from "@/lib/types";

export async function analyzeSubmission(
  imageBase64: string,
  mimeType: string,
  persona: Persona,
  colorStats: ColorStats,
): Promise<SubmissionAnalysis> {
  const requirements = persona.hiddenRequirements
    .map((r) => `- id "${r.id}": ${r.rule}`)
    .join("\n");

  const prompt = `You are analyzing a logo submitted by a freelancer for the client "${persona.business}".

Describe exactly what is in the image — colors, style, visual elements, any text. Be concrete and literal; the client will quote your findings on a call, so never invent details.

Judge each of these client requirements against the image:
${requirements}

Deterministic pixel data (computed in code, trust it over your own color impression):
- blueShare (fraction of opaque pixels in the blue hue range): ${colorStats.blueShare.toFixed(3)}
- dominant colors: ${colorStats.dominantColors.map((c) => `${c.hex} (${(c.share * 100).toFixed(0)}%)`).join(", ")}

For the "no-blue" style requirements: violated = true whenever blueShare > 0.05.`;

  return generateStructured(SubmissionAnalysisSchema, [
    { type: "text", text: prompt },
    { type: "image", data: imageBase64, mime_type: mimeType },
  ]);
}
