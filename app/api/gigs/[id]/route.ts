import { getGig } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const gig = await getGig(id);
  if (!gig) return Response.json({ error: "gig not found" }, { status: 404 });
  return Response.json(gig);
}
