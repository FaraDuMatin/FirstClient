"use client";

// Live voice call with the client persona. Fetches per-stage config (WebRTC
// token + prompt override) from the server, runs the ElevenLabs session, and
// saves the transcript on hangup before signaling completion.
// SDK v1 requires a ConversationProvider around the hook.

import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { useRef, useState } from "react";

type Stage = "briefing" | "revision";

type CallPanelProps = {
  gigId: string;
  stage: Stage;
  onCallEnded: () => void;
};

type CallConfig = {
  token?: string;
  prompt?: string;
  firstMessage?: string;
  error?: string;
};

export function CallPanel(props: CallPanelProps) {
  return (
    <ConversationProvider>
      <CallPanelInner {...props} />
    </ConversationProvider>
  );
}

function CallPanelInner({ gigId, stage, onCallEnded }: CallPanelProps) {
  const [phase, setPhase] = useState<"idle" | "connecting" | "live" | "saving">("idle");
  const [error, setError] = useState<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const savingRef = useRef(false);

  async function finishCall() {
    if (savingRef.current) return;
    savingRef.current = true;
    setPhase("saving");
    const conversationId = conversationIdRef.current;
    if (conversationId) {
      const post = () =>
        fetch(`/api/gigs/${gigId}/transcript`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stage, conversationId }),
        }).then((r) => r.json() as Promise<{ turns?: number }>);
      let saved = await post().catch(() => null);
      if (!saved?.turns) {
        // ElevenLabs transcripts lag hangup by a few seconds — retry once.
        await new Promise((r) => setTimeout(r, 4000));
        saved = await post().catch(() => null);
      }
    }
    setPhase("idle");
    onCallEnded();
  }

  const conversation = useConversation({
    onConnect: ({ conversationId }: { conversationId: string }) => {
      conversationIdRef.current = conversationId;
      setPhase("live");
    },
    onError: (message: string) => {
      setError(message);
      setPhase("idle");
    },
    onDisconnect: () => {
      void finishCall();
    },
  });

  async function start() {
    setError(null);
    setPhase("connecting");
    try {
      const res = await fetch(`/api/gigs/${gigId}/call?stage=${stage}`);
      const cfg = (await res.json()) as CallConfig;
      if (!res.ok || !cfg.token) throw new Error(cfg.error ?? `HTTP ${res.status}`);
      await navigator.mediaDevices.getUserMedia({ audio: true });
      savingRef.current = false;
      conversation.startSession({
        conversationToken: cfg.token,
        overrides: {
          agent: {
            prompt: { prompt: cfg.prompt },
            firstMessage: cfg.firstMessage,
          },
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase("idle");
    }
  }

  const button =
    "border-4 border-[#141111] px-5 py-2 font-[family-name:var(--font-pixel-heading)] text-[10px] tracking-widest shadow-[5px_5px_0_0_#141111] active:translate-x-1 active:translate-y-1 active:shadow-none";

  return (
    <div className="flex flex-col items-center gap-2">
      {phase === "idle" && (
        <button type="button" onClick={() => void start()} className={`${button} bg-[#7c8a6e] text-[#141111]`}>
          {stage === "briefing" ? "ANSWER THE CALL" : "TAKE THE REVISION CALL"}
        </button>
      )}
      {phase === "connecting" && (
        <p className="animate-pulse text-xl tracking-widest text-[#c9a84c]">CONNECTING…</p>
      )}
      {phase === "live" && (
        <>
          <p className="text-xl tracking-widest text-[#7c8a6e]">
            {conversation.isSpeaking ? "● MARCUS IS TALKING" : "○ YOUR TURN — SPEAK"}
          </p>
          <button
            type="button"
            onClick={() => conversation.endSession()}
            className={`${button} bg-[#6e2b2b] text-[#e8d9c0]`}
          >
            HANG UP
          </button>
        </>
      )}
      {phase === "saving" && (
        <p className="animate-pulse text-xl tracking-widest text-[#c9a84c]">SAVING TRANSCRIPT…</p>
      )}
      {error && <p className="max-w-sm text-center text-lg leading-5 text-[#c96a4c]">{error}</p>}
    </div>
  );
}
