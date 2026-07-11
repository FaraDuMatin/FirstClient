// Call config for the browser: WebRTC token + the stage-specific agent prompt.
// The revision stage refuses to start without a submission analysis — the
// client must react to the actual work, never improvise.

import { getGig } from "@/lib/db";
import { getConversationToken, hasElevenLabs } from "@/lib/elevenlabs";
import { buildBriefingPrompt, buildRevisionPrompt } from "@/lib/agent/prompt";
import { getPersona } from "@/lib/personas";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const stage = new URL(req.url).searchParams.get("stage");
  if (stage !== "briefing" && stage !== "revision") {
    return Response.json({ error: "stage must be 'briefing' or 'revision'" }, { status: 400 });
  }
  if (!hasElevenLabs()) {
    return Response.json(
      { error: "ELEVENLABS_API_KEY / ELEVENLABS_AGENT_ID not configured" },
      { status: 503 },
    );
  }

  const gig = await getGig(id);
  if (!gig) return Response.json({ error: "gig not found" }, { status: 404 });

  const persona = getPersona(gig.personaId);
  let prompt: string;
  let firstMessage: string;
  if (stage === "briefing") {
    prompt = buildBriefingPrompt(persona);
    firstMessage = persona.firstMessageBriefing;
  } else {
    if (!gig.submission) {
      return Response.json(
        { error: "no submission on this gig yet — the revision call needs the analyzed file" },
        { status: 409 },
      );
    }
    prompt = buildRevisionPrompt(persona, gig.submission);
    firstMessage = persona.firstMessageRevision;
  }

  const token = await getConversationToken();
  return Response.json({ token, prompt, firstMessage });
}
