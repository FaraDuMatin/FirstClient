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

  const prompt = `You are a direct, no-praise-padding communication coach reviewing how a freelancer SPOKE on two client calls (a briefing and a revision round). Judge only the freelancer's speech — not their design work.

${SPEECH_RUBRIC_TEXT}

CALIBRATION: strong = headline-first answers that stop cleanly; states things once; commits ("I'll have v1 Friday") instead of hedging ("I could maybe try"). Weak = circling back, filler padding, trailing off, over-explaining. A polite but rambling speaker should still score 2 on concision. Notes: 1-3 short bullets, each quoting or closely paraphrasing a real moment from the transcript.

Deterministic metrics (already computed in code — do not recompute, use as evidence):
${JSON.stringify(metrics, null, 2)}

${formatTranscript("briefing", briefing)}

${formatTranscript("revision", revision)}`;

  const judgment = await generateStructured(SpeechJudgmentSchema, [
    { type: "text", text: prompt },
  ]);
  return { metrics, judgment };
}
