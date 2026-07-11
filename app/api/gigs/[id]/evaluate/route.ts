// Debrief: two Zod-validated Gemini passes over the call transcripts —
// process rubric + speech analysis. Rubric text is stored with the scores.

import { getGig, saveGig } from "@/lib/db";
import { hasGemini } from "@/lib/gemini";
import { evaluateProcess, PROCESS_RUBRIC_TEXT } from "@/lib/evaluation/rubric";
import { analyzeSpeech, SPEECH_RUBRIC_TEXT } from "@/lib/evaluation/speech";
import { getPersona } from "@/lib/personas";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!hasGemini()) {
    return Response.json({ error: "GEMINI_API_KEY not configured" }, { status: 503 });
  }

  const gig = await getGig(id);
  if (!gig) return Response.json({ error: "gig not found" }, { status: 404 });

  const briefing = gig.conversations.briefing?.transcript ?? [];
  const revision = gig.conversations.revision?.transcript ?? [];
  if (!briefing.length && !revision.length) {
    return Response.json(
      { error: "no transcripts on this gig yet — finish a call first" },
      { status: 409 },
    );
  }

  const persona = getPersona(gig.personaId);
  const [process, speech] = await Promise.all([
    evaluateProcess(gig, persona, briefing, revision),
    analyzeSpeech(briefing, revision),
  ]);

  gig.scorecard = {
    process,
    speech,
    rubricText: { process: PROCESS_RUBRIC_TEXT, speech: SPEECH_RUBRIC_TEXT },
    evaluatedAt: new Date().toISOString(),
  };
  gig.events.push({ at: new Date().toISOString(), type: "debrief" });
  await saveGig(gig);

  return Response.json(gig.scorecard);
}
