import { createGig, listGigs } from "@/lib/db";
import { DEFAULT_PERSONA_ID } from "@/lib/personas";
import type { Gig } from "@/lib/types";

export async function POST() {
  const gig: Gig = {
    id: crypto.randomUUID().slice(0, 8),
    personaId: DEFAULT_PERSONA_ID,
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
