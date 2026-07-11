// Server-side ElevenLabs helpers. API key never reaches the browser.

import { TranscriptTurnSchema, type TranscriptTurn } from "@/lib/types";
import { z } from "zod";

const BASE = "https://api.elevenlabs.io";

export function hasElevenLabs(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_AGENT_ID);
}

function headers(): Record<string, string> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY is not set");
  return { "xi-api-key": key };
}

// WebRTC conversation token for the browser SDK (@elevenlabs/react).
export async function getConversationToken(): Promise<string> {
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!agentId) throw new Error("ELEVENLABS_AGENT_ID is not set");
  const res = await fetch(
    `${BASE}/v1/convai/conversation/token?agent_id=${encodeURIComponent(agentId)}`,
    { headers: headers(), cache: "no-store" },
  );
  if (!res.ok) {
    throw new Error(`ElevenLabs token request failed: ${res.status} ${await res.text()}`);
  }
  const body: unknown = await res.json();
  return z.object({ token: z.string() }).parse(body).token;
}

const ConversationResponseSchema = z.object({
  status: z.string().optional(),
  transcript: z
    .array(
      z.object({
        role: z.string(),
        message: z.string().nullable().optional(),
        time_in_call_secs: z.number().nullable().optional(),
      }),
    )
    .optional(),
});

// Transcript of a finished conversation. May be empty for a few seconds after
// hangup — callers should retry.
export async function fetchTranscript(
  conversationId: string,
): Promise<TranscriptTurn[]> {
  const res = await fetch(
    `${BASE}/v1/convai/conversations/${encodeURIComponent(conversationId)}`,
    { headers: headers(), cache: "no-store" },
  );
  if (!res.ok) {
    throw new Error(`ElevenLabs conversation fetch failed: ${res.status} ${await res.text()}`);
  }
  const body = ConversationResponseSchema.parse(await res.json());
  return (body.transcript ?? [])
    .filter((t) => typeof t.message === "string" && t.message.length > 0)
    .map((t) =>
      TranscriptTurnSchema.parse({
        role: t.role === "user" ? "user" : "agent",
        message: t.message,
        timeInCallSecs: t.time_in_call_secs ?? undefined,
      }),
    );
}
