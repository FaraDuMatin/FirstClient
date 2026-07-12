import { createGig, listGigs } from "@/lib/db";
import { DEFAULT_PERSONA_ID, isPersonaId } from "@/lib/personas";
import type { Gig } from "@/lib/types";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { personaId?: string };
  const personaId = body.personaId ?? DEFAULT_PERSONA_ID;
  if (!isPersonaId(personaId)) {
    return Response.json({ error: `unknown persona: ${personaId}` }, { status: 400 });
  }
  const gig: Gig = {
    id: crypto.randomUUID().slice(0, 8),
    personaId,
    state: "briefing",
    createdAt: new Date().toISOString(),
    events: [{ at: new Date().toISOString(), type: "created" }],
    conversations: {},
  };
  await createGig(gig);
  return Response.json(gig, { status: 201 });
}

export async function GET() {
  return Response.json(await listGigs());
}
