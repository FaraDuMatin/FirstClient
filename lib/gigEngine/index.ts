// The ONLY place gig state changes. UI code and API routes call advanceState;
// nothing else mutates gig.state (CLAUDE.md architecture rule).

import { getGig, saveGig } from "@/lib/db";
import type { Gig, GigState } from "@/lib/types";

const TRANSITIONS: Record<GigState, readonly GigState[]> = {
  briefing: ["scoping"],
  scoping: ["working"],
  working: ["revision"],
  // "working" re-entry = client asked for changes; the freelancer resubmits.
  revision: ["working", "delivered"],
  delivered: [],
};

export class GigEngineError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "GigEngineError";
  }
}

export function canAdvance(from: GigState, to: GigState): boolean {
  return TRANSITIONS[from].includes(to);
}

export async function advanceState(
  gigId: string,
  to: GigState,
  detail?: string,
): Promise<Gig> {
  const gig = await getGig(gigId);
  if (!gig) throw new GigEngineError(`gig ${gigId} not found`, 404);
  if (!canAdvance(gig.state, to)) {
    throw new GigEngineError(
      `invalid transition ${gig.state} -> ${to}`,
      409,
    );
  }
  gig.state = to;
  gig.events.push({
    at: new Date().toISOString(),
    type: `state:${to}`,
    detail,
  });
  await saveGig(gig);
  return gig;
}
