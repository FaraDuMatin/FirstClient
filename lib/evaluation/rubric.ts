// Process rubric: how the freelancer ran the gig — clarifying questions, scope
// discipline, tone, revision handling. Judged from the call transcripts.
// Style: brutally honest mentor with hard calibration caps — no praise padding.

import { generateStructured } from "@/lib/gemini";
import {
  ProcessRubricSchema,
  type Gig,
  type Persona,
  type ProcessRubric,
  type TranscriptTurn,
} from "@/lib/types";

export const PROCESS_RUBRIC_TEXT = `Process rubric (1-5 each): clarifyingQuestions — did they ask about the things that later became problems (colors, required text, deadline, budget)? scopeDiscipline — did they state what is and is not included before working? tone — professional, warm, unafraid to push back politely? revisionHandling — did they take specific criticism without collapsing or arguing, own their mistakes, and confirm concrete next steps? hireAgainSignal — would this client come back?`;

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

  const prompt = `You are a brutally honest freelancing mentor scoring how a beginner ran a complete logo gig with a client. Your job is to make them employable, not to make them feel good. Be direct and specific, no praise padding. Score the PROCESS, not the artwork.

${PROCESS_RUBRIC_TEXT}

The client had hidden requirements the freelancer could only surface by asking good questions during the briefing:
${hidden}

CALIBRATION — these are hard caps, do not average around them:
- clarifyingQuestions: 5 = asked about colors AND required text AND at least one logistics item (deadline, formats, budget). Missing a question that later caused a revision complaint CAPS this at 2, no matter how good the other questions were.
- scopeDiscipline: 5 = stated deliverables, revision count, and a deadline before starting work. Vague agreement ("sure, I'll figure something out") caps at 2. Never stating any scope = 1.
- tone: professional and warm with polite pushback when warranted = 4-5. A yes-man who agrees with everything = 3 max. Defensive, rude, or oversharing = 1-2.
- revisionHandling: 5 = took specific criticism without arguing or spiraling into apology, owned the mistake in one sentence, confirmed concrete changes and a deadline. Arguing with legitimate feedback OR apologizing repeatedly caps at 2.
- hireAgainSignal: "Would hire again" ONLY if no score is below 3 and the client got what they needed with minimal friction. "Would not return" if the freelancer caused avoidable rework AND handled it poorly. Otherwise "Would hire with doubts".

A transcript where the freelancer never surfaced a hidden requirement, never stated a scope, or rambled through the revision should land at 2 or below on those dimensions even if the overall vibe was pleasant. Pleasant is not the job.

whatWorked: 1-3 short bullets. Each bullet MUST contain a short VERBATIM quote from the transcript in double quotes ("...") showing the moment. If genuinely nothing, write exactly one bullet: "Nothing notable."
gaps: 1-3 short bullets. Each MUST quote the exact line where it happened (or name the question that was never asked) and say in a few words what to do instead.
priorityFix: THE single highest-leverage change, concrete enough to apply on the very next call. One sentence.
verdict: one blunt line, no hedging.

Scope the freelancer wrote: ${gig.scope ?? "(none written)"}

${formatTranscript("briefing", briefing)}

${formatTranscript("revision", revision)}`;

  return generateStructured(ProcessRubricSchema, [{ type: "text", text: prompt }]);
}
