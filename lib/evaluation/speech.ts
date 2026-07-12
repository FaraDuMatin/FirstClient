// Speech / communication analysis over the ElevenLabs call transcripts.
// Adapted from the GetThatJob interview-prep rubric. Deterministic metrics are
// computed in code; the LLM judges only what code can't (clarity, confidence).

import { generateStructured } from "@/lib/gemini";
import {
  SpeechJudgmentSchema,
  type SpeechAnalysis,
  type SpeechMetrics,
  type TranscriptTurn,
} from "@/lib/types";

export const SPEECH_RUBRIC_TEXT = `Speech rubric (1-5 each): clarity — easy to follow, headline-first; concision — says it once, stops; confidence — commits to statements, owns "I"; professionalism — client-appropriate tone. rambleScore: 5 = meandering, circular, filler-padded; 1 = tight. Metrics (filler count, words per turn, talk ratio) are computed from the transcript by code, not the model.`;

const FILLER_PATTERNS = [
  /\bum+\b/gi,
  /\buh+\b/gi,
  /\ber+m?\b/gi,
  /\blike\b/gi,
  /\bbasically\b/gi,
  /\bactually\b/gi,
  /\byou know\b/gi,
  /\bi mean\b/gi,
  /\bkind of\b/gi,
  /\bsort of\b/gi,
];

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export function computeSpeechMetrics(turns: TranscriptTurn[]): SpeechMetrics {
  const userTurns = turns.filter((t) => t.role === "user");
  const userWordCount = userTurns.reduce((n, t) => n + wordCount(t.message), 0);
  const agentWordCount = turns
    .filter((t) => t.role === "agent")
    .reduce((n, t) => n + wordCount(t.message), 0);

  let fillerCount = 0;
  for (const turn of userTurns) {
    for (const pattern of FILLER_PATTERNS) {
      fillerCount += turn.message.match(pattern)?.length ?? 0;
    }
  }

  const totalWords = userWordCount + agentWordCount;
  return {
    userWordCount,
    userTurnCount: userTurns.length,
    avgWordsPerTurn: userTurns.length ? userWordCount / userTurns.length : 0,
    fillerCount,
    fillerPerHundredWords: userWordCount ? (fillerCount / userWordCount) * 100 : 0,
    talkRatio: totalWords ? userWordCount / totalWords : 0,
  };
}

function formatTranscript(label: string, turns: TranscriptTurn[]): string {
  const lines = turns
    .map((t) => `${t.role === "user" ? "FREELANCER" : "CLIENT"}: ${t.message}`)
    .join("\n");
  return `--- ${label} call ---\n${lines}`;
}

export async function analyzeSpeech(
  briefing: TranscriptTurn[],
  revision: TranscriptTurn[],
): Promise<SpeechAnalysis> {
  const allTurns = [...briefing, ...revision];
  const metrics = computeSpeechMetrics(allTurns);

  const prompt = `You are a direct, no-praise-padding communication coach reviewing how a freelancer SPOKE on two client calls (a briefing and a revision round). Judge only the freelancer's speech — not their design work. Their single biggest risk is RAMBLING and hedged, filler-padded answers.

${SPEECH_RUBRIC_TEXT}

CALIBRATION — hard caps, use the deterministic metrics below as evidence, do not recompute them:
- fillerPerHundredWords > 5 caps concision at 3; > 10 caps it at 2.
- avgWordsPerTurn > 60 with circular or repeated content caps concision at 2 and pushes rambleScore to 4+.
- confidence: hedging in commitments ("maybe", "I could try", "sort of", trailing off) caps confidence at 3. Direct commitments with dates ("I'll send v2 tomorrow at 9") = 4-5.
- A strong turn leads with the headline, states it once, and stops. A polite but rambling speaker still scores 2 on concision — pleasant is not concise.
- rambleScore: 5 = meandering, circular, filler-padded across multiple turns; 1 = tight, headline-first, clean stops.

notes: 1-3 short bullets. Each MUST contain a short VERBATIM quote from the transcript in double quotes ("...") showing the habit in action.
priorityFix: ONE concrete speech habit to change on the next call. One sentence, no hedging.

Deterministic metrics (already computed in code — do not recompute, use as evidence):
${JSON.stringify(metrics, null, 2)}

${formatTranscript("briefing", briefing)}

${formatTranscript("revision", revision)}`;

  const judgment = await generateStructured(SpeechJudgmentSchema, [
    { type: "text", text: prompt },
  ]);
  return { metrics, judgment };
}
