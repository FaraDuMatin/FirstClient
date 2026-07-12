// Full gig lifecycle against the REAL database and REAL Gemini — no voice, no
// UI. Fake-but-realistic transcripts stand in for the live calls.
// Run: npm run test:flow

import sharp from "sharp";
import { createGig, getGig, saveGig } from "../lib/db";
import { advanceState, GigEngineError } from "../lib/gigEngine";
import { getPersona, DEFAULT_PERSONA_ID } from "../lib/personas";
import { computeColorStats } from "../lib/submission/colors";
import { analyzeSubmission } from "../lib/submission/analyze";
import { evaluateProcess, PROCESS_RUBRIC_TEXT } from "../lib/evaluation/rubric";
import { analyzeSpeech, computeSpeechMetrics, SPEECH_RUBRIC_TEXT } from "../lib/evaluation/speech";
import type { Gig, TranscriptTurn } from "../lib/types";

try {
  process.loadEnvFile(".env.local");
} catch {
  // fall through to process env
}

let failures = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) console.log(`  [OK]   ${name}${detail ? ` — ${detail}` : ""}`);
  else {
    failures++;
    console.log(`  [FAIL] ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

// Realistic fake transcripts. The freelancer asks about text but NOT colors —
// so the rubric should reward the wordmark question and punish the missed
// color question that caused the blue revision.
const FAKE_BRIEFING: TranscriptTurn[] = [
  { role: "agent", message: "Hey, thanks for taking the call. So — Beanhound. We roast coffee, small batches, and our logo is embarrassing. I need something new. Where do you want to start?" },
  { role: "user", message: "Um, thanks for having me. So, like, basically I want to understand your business first. What feeling should the logo give people?" },
  { role: "agent", message: "Warm. Handmade. Like our shop, not like a bank. Maybe something with a dog — my roaster is named after my dog." },
  { role: "user", message: "Got it. And what text should actually appear in the logo — the full name Beanhound, or initials?" },
  { role: "agent", message: "The full name. People keep calling us Beanhouse, drives me crazy. Beanhound, spelled right, big enough to read." },
  { role: "user", message: "Okay so, um, I'll do a hand-drawn dog mark with the full wordmark Beanhound. I'll send a first version Friday. One logo, two revisions included. Does that work?" },
  { role: "agent", message: "Friday works. Fine — send it." },
];

const FAKE_REVISION: TranscriptTurn[] = [
  { role: "agent", message: "Okay, I opened the file you sent. The dog is nice. But the whole thing is blue. Why is it blue? I cannot have blue. I told— did I not mention that? Anything but blue." },
  { role: "user", message: "You didn't mention it, but honestly I also didn't ask about colors, so that's on me. I'll switch the palette to warm browns and cream, keep the same mark, and send it tomorrow morning." },
  { role: "agent", message: "Browns could work. Tomorrow morning then. And the name stays exactly as it is — that part you got right." },
  { role: "user", message: "Understood: same wordmark, new warm palette, delivery tomorrow 9am. Anything else before I go?" },
  { role: "agent", message: "No. Tomorrow." },
];

async function main() {
  const persona = getPersona(DEFAULT_PERSONA_ID);
  const usingMongo = Boolean(process.env.MONGODB_URI);
  console.log(`FirstClient gig-flow test (db: ${usingMongo ? "MongoDB Atlas" : "in-memory"})\n`);

  // --- create ---
  const gig: Gig = {
    id: `test-${Date.now().toString(36)}`,
    personaId: DEFAULT_PERSONA_ID,
    state: "briefing",
    createdAt: new Date().toISOString(),
    events: [{ at: new Date().toISOString(), type: "created" }],
    conversations: {},
  };
  await createGig(gig);
  const loaded = await getGig(gig.id);
  check("db round-trip after create", loaded?.id === gig.id && loaded.state === "briefing");

  // --- state machine: invalid jump must be rejected ---
  let rejected = false;
  try {
    await advanceState(gig.id, "delivered");
  } catch (e) {
    rejected = e instanceof GigEngineError && e.status === 409;
  }
  check("invalid transition briefing->delivered rejected (409)", rejected);

  // --- briefing done -> scoping -> working ---
  await advanceState(gig.id, "scoping", "briefing call ended");
  const gigScoping = await getGig(gig.id);
  if (gigScoping) {
    gigScoping.scope = "One logo (hand-drawn dog + full 'Beanhound' wordmark), two revisions included, v1 by Friday.";
    gigScoping.conversations.briefing = { conversationId: "fake-briefing", transcript: FAKE_BRIEFING };
    await saveGig(gigScoping);
  }
  await advanceState(gig.id, "working", "scope accepted");
  check("advanced to working", (await getGig(gig.id))?.state === "working");

  // --- submission: blue logo (the trap must fire) ---
  const bluePng = await sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240">
        <rect width="400" height="240" fill="#f5f0e6"/>
        <circle cx="200" cy="90" r="50" fill="#2456c9"/>
        <text x="200" y="200" font-family="Arial" font-size="42" font-weight="bold" fill="#2456c9" text-anchor="middle">Beanhound</text>
      </svg>`,
    ),
  )
    .png()
    .toBuffer();

  const colorStats = await computeColorStats(bluePng);
  const analysis = await analyzeSubmission(
    { type: "image", data: bluePng.toString("base64"), mime_type: "image/png" },
    persona,
    colorStats,
  );
  const blueJudgment = analysis.hiddenRequirementViolations.find((v) => v.requirementId === "no-blue");
  check("submission analysis flags no-blue violation", blueJudgment?.violated === true, `blueShare=${colorStats.blueShare.toFixed(3)}`);

  const gigWorking = await getGig(gig.id);
  if (gigWorking) {
    gigWorking.submission = {
      imageDataUrl: "(test — omitted)",
      mimeType: "image/png",
      submittedAt: new Date().toISOString(),
      colorStats,
      analysis,
    };
    gigWorking.events.push({ at: new Date().toISOString(), type: "submission" });
    await saveGig(gigWorking);
  }
  await advanceState(gig.id, "revision", "deliverable submitted");

  // --- revision call done -> delivered ---
  const gigRevision = await getGig(gig.id);
  if (gigRevision) {
    gigRevision.conversations.revision = { conversationId: "fake-revision", transcript: FAKE_REVISION };
    await saveGig(gigRevision);
  }
  await advanceState(gig.id, "delivered", "revision call ended");
  check("reached delivered", (await getGig(gig.id))?.state === "delivered");

  // --- deterministic speech metrics on a known transcript ---
  const metrics = computeSpeechMetrics([...FAKE_BRIEFING, ...FAKE_REVISION]);
  check("speech metrics computed", metrics.userTurnCount === 5 && metrics.fillerCount >= 4, `turns=${metrics.userTurnCount} fillers=${metrics.fillerCount} talkRatio=${metrics.talkRatio.toFixed(2)}`);

  // --- evaluation (real Gemini, both passes) ---
  const finalGig = await getGig(gig.id);
  if (!finalGig) throw new Error("gig vanished");
  const [processRubric, speech] = await Promise.all([
    evaluateProcess(finalGig, persona, FAKE_BRIEFING, FAKE_REVISION),
    analyzeSpeech(FAKE_BRIEFING, FAKE_REVISION),
  ]);

  console.log(`\n  process scores: ${JSON.stringify(processRubric.scores)}`);
  console.log(`  verdict: ${processRubric.verdict}`);
  console.log(`  priority fix: ${processRubric.priorityFix}`);
  console.log(`  speech scores: ${JSON.stringify(speech.judgment.scores)} ramble=${speech.judgment.rambleScore}`);

  const s = processRubric.scores;
  check("process scores in 1-5 range", [s.clarifyingQuestions, s.scopeDiscipline, s.tone, s.revisionHandling].every((n) => n >= 1 && n <= 5));
  check("clarifyingQuestions penalized (missed colors) <= 3", s.clarifyingQuestions <= 3, `got ${s.clarifyingQuestions}`);

  finalGig.scorecard = {
    process: processRubric,
    speech,
    rubricText: { process: PROCESS_RUBRIC_TEXT, speech: SPEECH_RUBRIC_TEXT },
    evaluatedAt: new Date().toISOString(),
  };
  await saveGig(finalGig);
  const persisted = await getGig(gig.id);
  check("scorecard persisted", Boolean(persisted?.scorecard?.process && persisted.scorecard.speech));

  console.log(`\n${failures === 0 ? "ALL GREEN" : `${failures} FAILURE(S)`} — gig id ${gig.id}${usingMongo ? " (check Atlas Data Explorer: firstclient.gigs)" : ""}`);
  process.exitCode = failures === 0 ? 0 : 1;

  // Mongo client keeps the event loop alive; exit explicitly.
  setTimeout(() => process.exit(process.exitCode ?? 0), 100);
}

void main();
