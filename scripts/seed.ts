// Demo insurance. Seeds ONE complete gig (fixed id "demo-fallback") into the
// db. Fully static data — no Gemini, no ElevenLabs. Idempotent (upsert).
// Run by hand: npm run seed. Nothing in the app ever calls this.

import sharp from "sharp";
import { saveGig } from "../lib/db";
import type { Gig } from "../lib/types";

process.loadEnvFile?.(".env.local");

const at = (minAgo: number) => new Date(Date.now() - minAgo * 60_000).toISOString();

async function makeLogo(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
    <rect width="400" height="400" fill="#f4f0e4"/>
    <circle cx="200" cy="170" r="120" fill="#2456c9"/>
    <circle cx="200" cy="170" r="95" fill="#1d3f8f"/>
    <text x="200" y="185" font-family="Georgia" font-size="44" font-weight="bold" fill="#ffffff" text-anchor="middle">Beanhound</text>
    <text x="200" y="330" font-family="Georgia" font-size="24" fill="#3a3532" text-anchor="middle">COFFEE ROASTERS</text>
  </svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

async function main() {
  const gig: Gig = {
    id: "demo-fallback",
    personaId: "logo-client-v1",
    state: "delivered",
    createdAt: at(60),
    scope:
      "One logo for Beanhound Coffee Roasters: primary mark + wordmark, 2 revision rounds included, final files (PNG + SVG) within 48h.",
    events: [
      { at: at(60), type: "created" },
      { at: at(55), type: "state:scoping", detail: "briefing call ended" },
      { at: at(50), type: "state:working" },
      { at: at(35), type: "submission" },
      { at: at(34), type: "state:revision", detail: "deliverable submitted" },
      { at: at(20), type: "call:revision" },
      { at: at(18), type: "state:delivered", detail: "revision call ended" },
      { at: at(15), type: "debrief" },
    ],
    conversations: {
      briefing: {
        conversationId: "seeded-demo-briefing",
        transcript: [
          { role: "agent", message: "Hey, thanks for taking the call. So — Beanhound. We roast coffee, small batches, and our logo is embarrassing. I need something new. Where do you want to start?" },
          { role: "user", message: "Thanks Marcus. Um, so tell me a bit about the shop — what feeling do you want the logo to give?" },
          { role: "agent", message: "Warm. Handmade. Like the shop. My roaster's named after my dog, so maybe a dog? Honestly I'll know it when I see it." },
          { role: "user", message: "Got it. A dog could work. What's the deadline, and do you need specific file formats?" },
          { role: "agent", message: "Fast. Days, not weeks. Files — whatever printers need, you tell me." },
          { role: "user", message: "Okay, I'll send a first version in 48 hours, PNG and SVG. One mark plus a wordmark, two revision rounds. Sound fair?" },
          { role: "agent", message: "Two rounds, fine. Don't make me use them both. Anything else?" },
          { role: "user", message: "No, I think I have what I need. I'll get started." },
          { role: "agent", message: "Alright. Send it when it's done. Bye." },
        ],
      },
      revision: {
        conversationId: "seeded-demo-revision",
        transcript: [
          { role: "agent", message: "Okay, I opened the file you sent. I've been staring at it for ten minutes. Let's talk." },
          { role: "user", message: "Sure — what do you think?" },
          { role: "agent", message: "It's BLUE. The whole thing is blue. I can't have blue anywhere near Beanhound — long story, but blue is the one thing I'd never accept. You never asked me about colors." },
          { role: "user", message: "You're right, I didn't ask — that's on me. I'll rework it in warm browns and creams today and send v2 by tomorrow 9am. Does that work?" },
          { role: "agent", message: "Browns. Warm. Yes. The dog and the name can stay — the name at least is right. Tomorrow 9am, and this counts as round one." },
          { role: "user", message: "Understood. Warm palette, same layout, v2 tomorrow 9am." },
          { role: "agent", message: "Good. That's how you recover a call. Talk tomorrow." },
        ],
      },
    },
    submission: {
      imageDataUrl: "PLACEHOLDER",
      mimeType: "image/png",
      submittedAt: at(35),
      colorStats: {
        dominantColors: [
          { hex: "#f0f0e0", share: 0.55 },
          { hex: "#3050d0", share: 0.24 },
          { hex: "#103090", share: 0.17 },
        ],
        blueShare: 0.41,
      },
      analysis: {
        overallDescription:
          "A circular badge logo on a cream background: a solid blue outer disc with a darker blue inner circle, the word 'Beanhound' in white serif type across the center, and 'COFFEE ROASTERS' beneath the badge.",
        detectedColors: [
          { name: "royal blue", hex: "#2456c9", prominence: "dominant" },
          { name: "navy blue", hex: "#1d3f8f", prominence: "secondary" },
          { name: "cream", hex: "#f4f0e4", prominence: "secondary" },
        ],
        styleDescriptors: ["badge", "classic", "clean"],
        elements: ["circular badge", "wordmark"],
        textInLogo: ["Beanhound", "COFFEE ROASTERS"],
        hiddenRequirementViolations: [
          { requirementId: "no-blue", violated: true, evidence: "The badge is dominated by royal and navy blue (41% of pixels in the blue hue range)." },
          { requirementId: "wordmark-beanhound", violated: false, evidence: "The logo contains the exact word 'Beanhound' in the center." },
        ],
      },
    },
    scorecard: {
      process: {
        scores: { clarifyingQuestions: 2, scopeDiscipline: 4, tone: 4, revisionHandling: 5 },
        hireAgainSignal: "Would hire with doubts",
        whatWorked: [
          'Clear scope on the call: "One mark plus a wordmark, two revision rounds" — stated before starting work.',
          'Textbook recovery in revision: "You\'re right, I didn\'t ask — that\'s on me. I\'ll rework it... v2 by tomorrow 9am."',
        ],
        gaps: [
          'Never asked about colors during briefing — the exact thing that blew up the revision. One question ("any colors you love or hate?") would have prevented the rework.',
        ],
        priorityFix: "Add a color likes/hates question to every briefing — it cost you a full revision round here.",
        verdict: "Solid process instincts, sunk by one missing question.",
      },
      speech: {
        metrics: { userWordCount: 118, userTurnCount: 7, avgWordsPerTurn: 16.9, fillerCount: 2, fillerPerHundredWords: 1.7, talkRatio: 0.42 },
        judgment: {
          scores: { clarity: 4, concision: 4, confidence: 4, professionalism: 5 },
          rambleScore: 2,
          notes: [
            'Commits with specifics instead of hedging: "PNG and SVG... two revision rounds. Sound fair?"',
            'One filler opener under pressure: "Um, so tell me a bit about the shop..."',
          ],
          priorityFix: "Drop the 'um' openers — pause silently instead, it reads as confidence.",
        },
      },
      rubricText: {
        process:
          "Process rubric (1-5 each): clarifyingQuestions — did they ask about the things that later became problems? scopeDiscipline — did they state what is included before working? tone — professional, warm, unafraid to push back politely? revisionHandling — did they take specific criticism, own mistakes, confirm next steps? hireAgainSignal — would this client come back?",
        speech:
          "Speech rubric (1-5 each): clarity, concision, confidence, professionalism. rambleScore: 5 = meandering and filler-padded. Metrics (filler count, words per turn, talk ratio) computed from the transcript by code, not the model.",
      },
      evaluatedAt: at(15),
    },
  };

  gig.submission!.imageDataUrl = await makeLogo();
  await saveGig(gig);
  console.log(`[seed] gig "demo-fallback" written to ${process.env.MONGODB_URI ? "MongoDB Atlas" : "in-memory store (no MONGODB_URI — will NOT persist)"}`);
  console.log("[seed] view at /fallback or /gig/demo-fallback");
  process.exit(0);
}

main().catch((e) => {
  console.error("[seed] FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});
