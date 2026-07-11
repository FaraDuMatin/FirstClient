import { z } from "zod";

// ---------- Gig lifecycle ----------

export const GIG_STATES = [
  "briefing",
  "scoping",
  "working",
  "revision",
  "delivered",
] as const;
export const GigStateSchema = z.enum(GIG_STATES);
export type GigState = z.infer<typeof GigStateSchema>;

export const CALL_STAGES = ["briefing", "revision"] as const;
export type CallStage = (typeof CALL_STAGES)[number];

// ---------- Persona (data, not code — see lib/personas/) ----------

export const HiddenRequirementSchema = z.object({
  id: z.string(),
  rule: z.string(),
  detection: z.enum(["color", "text", "style"]),
  revealIfAskedAbout: z.string(),
  clientBackstory: z.string(),
});
export type HiddenRequirement = z.infer<typeof HiddenRequirementSchema>;

export const PersonaSchema = z.object({
  id: z.string(),
  name: z.string(),
  business: z.string(),
  personality: z.string(),
  brief: z.string(),
  firstMessageBriefing: z.string(),
  firstMessageRevision: z.string(),
  hiddenRequirements: z.array(HiddenRequirementSchema),
  revisionStyle: z.string(),
});
export type Persona = z.infer<typeof PersonaSchema>;

// ---------- Transcript (from the ElevenLabs conversation API) ----------

export const TranscriptTurnSchema = z.object({
  role: z.enum(["user", "agent"]),
  message: z.string(),
  timeInCallSecs: z.number().optional(),
});
export type TranscriptTurn = z.infer<typeof TranscriptTurnSchema>;

export const ConversationRecordSchema = z.object({
  conversationId: z.string(),
  transcript: z.array(TranscriptTurnSchema).optional(),
});
export type ConversationRecord = z.infer<typeof ConversationRecordSchema>;

// ---------- Submission analysis ----------

// Deterministic pass computed in code (lib/submission/colors.ts) — demo
// insurance so the "no blue" trap never depends on an LLM's color naming.
export const ColorStatsSchema = z.object({
  dominantColors: z.array(z.object({ hex: z.string(), share: z.number() })),
  blueShare: z.number(),
});
export type ColorStats = z.infer<typeof ColorStatsSchema>;

// Gemini vision output. Injected verbatim into the agent's revision-stage
// context — the demo-critical mechanic.
export const SubmissionAnalysisSchema = z.object({
  overallDescription: z
    .string()
    .describe("One short paragraph describing the logo as a client would see it"),
  detectedColors: z.array(
    z.object({
      name: z.string().describe("Plain color name, e.g. 'navy blue'"),
      hex: z.string().describe("Approximate hex value, e.g. '#1e3a8a'"),
      prominence: z.enum(["dominant", "secondary", "accent"]),
    }),
  ),
  styleDescriptors: z
    .array(z.string())
    .describe("e.g. 'minimalist', 'hand-drawn', 'corporate'"),
  elements: z
    .array(z.string())
    .describe("Visual elements present, e.g. 'coffee cup icon', 'wordmark'"),
  textInLogo: z.array(z.string()).describe("Exact text visible in the logo"),
  hiddenRequirementViolations: z.array(
    z.object({
      requirementId: z.string(),
      violated: z.boolean(),
      evidence: z.string().describe("What in the image supports this judgment"),
    }),
  ),
});
export type SubmissionAnalysis = z.infer<typeof SubmissionAnalysisSchema>;

export const SubmissionSchema = z.object({
  imageDataUrl: z.string(),
  mimeType: z.string(),
  submittedAt: z.string(),
  colorStats: ColorStatsSchema.optional(),
  analysis: SubmissionAnalysisSchema.optional(),
});
export type Submission = z.infer<typeof SubmissionSchema>;

// ---------- Evaluation: process rubric ----------

export const ProcessRubricSchema = z.object({
  scores: z.object({
    clarifyingQuestions: z.number().int().min(1).max(5),
    scopeDiscipline: z.number().int().min(1).max(5),
    tone: z.number().int().min(1).max(5),
    revisionHandling: z.number().int().min(1).max(5),
  }),
  whatWorked: z.array(z.string()),
  gaps: z.array(z.string()),
  priorityFix: z.string().describe("The one concrete change for the next gig"),
  verdict: z.string().describe("One blunt line"),
});
export type ProcessRubric = z.infer<typeof ProcessRubricSchema>;

// ---------- Evaluation: speech / communication analysis ----------

// Computed in code, never by the LLM.
export const SpeechMetricsSchema = z.object({
  userWordCount: z.number(),
  userTurnCount: z.number(),
  avgWordsPerTurn: z.number(),
  fillerCount: z.number(),
  fillerPerHundredWords: z.number(),
  talkRatio: z.number().describe("user words / total words, 0-1"),
});
export type SpeechMetrics = z.infer<typeof SpeechMetricsSchema>;

export const SpeechJudgmentSchema = z.object({
  scores: z.object({
    clarity: z.number().int().min(1).max(5),
    concision: z.number().int().min(1).max(5),
    confidence: z.number().int().min(1).max(5),
    professionalism: z.number().int().min(1).max(5),
  }),
  rambleScore: z
    .number()
    .int()
    .min(1)
    .max(5)
    .describe("5 = very rambly, 1 = tight and headline-first"),
  notes: z.array(z.string()),
  priorityFix: z.string(),
});
export type SpeechJudgment = z.infer<typeof SpeechJudgmentSchema>;

export const SpeechAnalysisSchema = z.object({
  metrics: SpeechMetricsSchema,
  judgment: SpeechJudgmentSchema,
});
export type SpeechAnalysis = z.infer<typeof SpeechAnalysisSchema>;

// ---------- Scorecard (rubric text stored alongside — no black-box numbers) ----------

export const ScorecardSchema = z.object({
  process: ProcessRubricSchema,
  speech: SpeechAnalysisSchema,
  rubricText: z.object({ process: z.string(), speech: z.string() }),
  evaluatedAt: z.string(),
});
export type Scorecard = z.infer<typeof ScorecardSchema>;

// ---------- Gig document ----------

export const GigEventSchema = z.object({
  at: z.string(),
  type: z.string(),
  detail: z.string().optional(),
});
export type GigEvent = z.infer<typeof GigEventSchema>;

export const GigSchema = z.object({
  id: z.string(),
  personaId: z.string(),
  state: GigStateSchema,
  createdAt: z.string(),
  events: z.array(GigEventSchema),
  scope: z.string().optional(),
  conversations: z.object({
    briefing: ConversationRecordSchema.optional(),
    revision: ConversationRecordSchema.optional(),
  }),
  submission: SubmissionSchema.optional(),
  scorecard: ScorecardSchema.optional(),
});
export type Gig = z.infer<typeof GigSchema>;
