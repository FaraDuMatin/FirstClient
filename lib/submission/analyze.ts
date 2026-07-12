// Submission ingestion: file -> Gemini vision -> structured, Zod-validated
// findings. The output is injected verbatim into the agent's revision context.
// Takes a ready-made media part (image or PDF document); colorStats is absent
// for PDFs, where the pixel pass can't run.

import { generateStructured, type GeminiPart } from "@/lib/gemini";
import {
  SubmissionAnalysisSchema,
  type ColorStats,
  type Persona,
  type SubmissionAnalysis,
} from "@/lib/types";

export async function analyzeSubmission(
  media: Exclude<GeminiPart, { type: "text" }>,
  persona: Persona,
  colorStats?: ColorStats,
): Promise<SubmissionAnalysis> {
  const requirements = persona.hiddenRequirements
    .map((r) => `- id "${r.id}": ${r.rule}`)
    .join("\n");

  const colorSection = colorStats
    ? `Deterministic pixel data (computed in code, trust it over your own color impression):
- blueShare (fraction of opaque pixels in the blue hue range): ${colorStats.blueShare.toFixed(3)}
- redShare (fraction in the red hue range): ${(colorStats.redShare ?? 0).toFixed(3)}
- dominant colors: ${colorStats.dominantColors.map((c) => `${c.hex} (${(c.share * 100).toFixed(0)}%)`).join(", ")}

For color requirements: a "no blue" requirement is violated whenever blueShare > 0.05; a "no red" requirement is violated whenever redShare > 0.05.`
    : `No pixel data is available for this file type. Judge the colors yourself and be strict: ANY shade of blue — navy, royal, cyan, blue-leaning teal — counts as blue for a "no blue" requirement.`;

  const prompt = `You are analyzing a logo submitted by a freelancer for the client "${persona.business}".

Describe exactly what is in the file — colors, style, visual elements, any text. Be concrete and literal; the client will quote your findings on a call, so never invent details.

Judge each of these client requirements against the submission:
${requirements}

${colorSection}`;

  return generateStructured(SubmissionAnalysisSchema, [
    { type: "text", text: prompt },
    media,
  ]);
}
