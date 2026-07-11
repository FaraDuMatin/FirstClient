import { getGig, saveGig } from "@/lib/db";
import { advanceState, GigEngineError } from "@/lib/gigEngine";
import { GigStateSchema } from "@/lib/types";
import { z } from "zod";

const BodySchema = z.object({
  to: GigStateSchema,
  detail: z.string().optional(),
  scope: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "body must be { to: GigState }" }, { status: 400 });
  }

  // A scope sent alongside the scoping->working transition is stored first.
  if (parsed.data.scope !== undefined) {
    const gig = await getGig(id);
    if (!gig) return Response.json({ error: "gig not found" }, { status: 404 });
    gig.scope = parsed.data.scope;
    await saveGig(gig);
  }

  try {
    const gig = await advanceState(id, parsed.data.to, parsed.data.detail);
    return Response.json(gig);
  } catch (e) {
    if (e instanceof GigEngineError) {
      return Response.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
