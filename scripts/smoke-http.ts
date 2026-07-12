// HTTP smoke test of the demo path against a running dev server (no voice):
// create gig -> advance -> submission upload -> revision call config.
// Run with dev server up: npx tsx scripts/smoke-http.ts

import sharp from "sharp";

const BASE = "http://localhost:3000";

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  const body = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status} ${body.error ?? ""}`);
  return body;
}

const json = (data: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});

async function waitForServer(tries = 30): Promise<void> {
  for (let i = 0; i < tries; i++) {
    try {
      await fetch(BASE);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error("dev server did not come up");
}

async function main() {
  await waitForServer();
  console.log("server up");

  const gig = await call<{ id: string; state: string }>("/api/gigs", { method: "POST" });
  console.log(`[OK] gig created: ${gig.id} (${gig.state})`);

  await call(`/api/gigs/${gig.id}/advance`, json({ to: "scoping", detail: "smoke" }));
  const working = await call<{ state: string; scope?: string }>(
    `/api/gigs/${gig.id}/advance`,
    json({ to: "working", scope: "One logo, two revisions, Friday." }),
  );
  console.log(`[OK] advanced to ${working.state}, scope saved: ${Boolean(working.scope)}`);

  // blue logo -> the trap must fire through the real route
  const png = await sharp({
    create: { width: 200, height: 200, channels: 3, background: "#2563eb" },
  })
    .png()
    .toBuffer();
  const submitted = await call<{
    state: string;
    submission?: { analysis?: { hiddenRequirementViolations: { requirementId: string; violated: boolean }[] } };
  }>(`/api/gigs/${gig.id}/submission`, json({ imageDataUrl: `data:image/png;base64,${png.toString("base64")}` }));
  const blue = submitted.submission?.analysis?.hiddenRequirementViolations.find(
    (v) => v.requirementId === "no-blue",
  );
  console.log(`[${submitted.state === "revision" && blue?.violated ? "OK" : "FAIL"}] submission -> state=${submitted.state}, no-blue violated=${blue?.violated}`);

  const cfg = await call<{ token: string; prompt: string; firstMessage: string }>(
    `/api/gigs/${gig.id}/call?stage=revision`,
  );
  const promptHasAnalysis = cfg.prompt.includes("blueShare") || cfg.prompt.includes("hiddenRequirementViolations");
  console.log(`[${cfg.token && promptHasAnalysis ? "OK" : "FAIL"}] revision call config: token minted, prompt embeds analysis=${promptHasAnalysis}`);

  console.log("\nSMOKE TEST DONE");
}

void main();
