// Records the conversation id for a call stage and pulls the transcript from
// ElevenLabs. Transcripts lag hangup by a few seconds — clients may re-POST.

import { getGig, saveGig } from "@/lib/db";
import { fetchTranscript, hasElevenLabs } from "@/lib/elevenlabs";
import { z } from "zod";

const BodySchema = z.object({
  stage: z.enum(["briefing", "revision"]),
  conversationId: z.string().min(1),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: "body must be { stage: 'briefing'|'revision', conversationId }" },
      { status: 400 },
    );
  }
  if (!hasElevenLabs()) {
    return Response.json({ error: "ElevenLabs not configured" }, { status: 503 });
  }

  const gig = await getGig(id);
  if (!gig) return Response.json({ error: "gig not found" }, { status: 404 });

  const { stage, conversationId } = parsed.data;
  const transcript = await fetchTranscript(conversationId).catch(() => []);
  gig.conversations[stage] = {
    conversationId,
    transcript: transcript.length ? transcript : undefined,
  };
  gig.events.push({ at: new Date().toISOString(), type: `call:${stage}` });
  await saveGig(gig);

  return Response.json({ turns: transcript.length, gig });
}
