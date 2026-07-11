// Submission ingestion (build priority #1): upload -> deterministic color pass
// -> Gemini vision analysis -> stored on the gig -> state advances to revision.

import { getGig, saveGig } from "@/lib/db";
import { hasGemini } from "@/lib/gemini";
import { advanceState, GigEngineError } from "@/lib/gigEngine";
import { getPersona } from "@/lib/personas";
import { analyzeSubmission } from "@/lib/submission/analyze";
import { computeColorStats } from "@/lib/submission/colors";
import type { Submission } from "@/lib/types";
import { z } from "zod";

export const runtime = "nodejs"; // sharp needs Node

const BodySchema = z.object({
  // e.g. "data:image/png;base64,iVBOR..."
  imageDataUrl: z.string().regex(/^data:image\/[a-z+]+;base64,/),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const gig = await getGig(id);
  if (!gig) return Response.json({ error: "gig not found" }, { status: 404 });
  if (gig.state !== "working") {
    return Response.json(
      { error: `submissions are only accepted in 'working' state (current: ${gig.state})` },
      { status: 409 },
    );
  }

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: "body must be { imageDataUrl: 'data:image/...;base64,...' }" },
      { status: 400 },
    );
  }

  const { imageDataUrl } = parsed.data;
  const mimeType = imageDataUrl.slice(5, imageDataUrl.indexOf(";"));
  const base64 = imageDataUrl.slice(imageDataUrl.indexOf(",") + 1);

  const submission: Submission = {
    imageDataUrl,
    mimeType,
    submittedAt: new Date().toISOString(),
  };

  try {
    submission.colorStats = await computeColorStats(Buffer.from(base64, "base64"));
  } catch (e) {
    return Response.json(
      { error: `could not decode image: ${e instanceof Error ? e.message : String(e)}` },
      { status: 400 },
    );
  }

  if (hasGemini()) {
    submission.analysis = await analyzeSubmission(
      base64,
      mimeType,
      getPersona(gig.personaId),
      submission.colorStats,
    );
  }

  gig.submission = submission;
  gig.events.push({ at: new Date().toISOString(), type: "submission" });
  await saveGig(gig);

  try {
    const advanced = await advanceState(id, "revision", "deliverable submitted");
    return Response.json(advanced, { status: 201 });
  } catch (e) {
    if (e instanceof GigEngineError) {
      return Response.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
