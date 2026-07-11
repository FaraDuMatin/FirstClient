// Process rubric: how the freelancer ran the gig — clarifying questions, scope
// discipline, tone, revision handling. Judged from the call transcripts.

import { generateStructured } from "@/lib/gemini";
import {
  ProcessRubricSchema,
  type Gig,
  type Persona,
  type ProcessRubric,
  type TranscriptTurn,
} from "@/lib/types";

export const PROCESS_RUBRIC_TEXT = `Process rubric (1-5 each): clarifyingQuestions — did they ask about the things that later became problems (colors, required text, deadline, budget)? scopeDiscipline — did they state what is and is not included before working? tone — professional, warm, unafraid to push back politely? revisionHandling — did they take specific criticism without collapsing or arguing, and confirm concrete next steps?`;

function formatTranscript(label: string, turns: TranscriptTurn[]): string {
  const lines = turns
    .map((t) => `${t.role === "user" ? "FREELANCER" : "CLIENT"}: ${t.message}`)
    .join("\n");
  return `--- ${label} call ---\n${lines}`;
}

export async function evaluateProcess(
  gig: Gig,
  persona: Persona,
  briefing: TranscriptTurn[],
  revision: TranscriptTurn[],
): Promise<ProcessRubric> {
  const hidden = persona.hiddenRequirements
    .map((r) => `- ${r.rule} (client only reveals this if asked about: ${r.revealIfAskedAbout})`)
    .join("\n");

  const prompt = `You are a blunt freelancing mentor scoring how a beginner freelancer ran a complete logo gig with a client. Score the PROCESS, not the artwork.

${PROCESS_RUBRIC_TEXT}

The client had hidden requirements the freelancer could only surface by asking good questions during the briefing:
${hidden}

CALIBRATION: a 5 on clarifyingQuestions means the freelancer asked about colors AND required text AND at least one logistics item (deadline, formats, budget). Missing the question that later caused a revision complaint caps clarifyingQuestions at 2. Vague agreement ("sure, I'll figure something out") instead of a stated scope caps scopeDiscipline at 2. whatWorked and gaps: 1-3 short bullets each, tied to real moments. priorityFix: the single highest-leverage change. verdict: one blunt line.

Scope the freelancer wrote: ${gig.scope ?? "(none written)"}

${formatTranscript("briefing", briefing)}

${formatTranscript("revision", revision)}`;

  return generateStructured(ProcessRubricSchema, [{ type: "text", text: prompt }]);
}
