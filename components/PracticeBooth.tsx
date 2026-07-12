"use client";

// The practice booth — full gig loop for one persona. /practice and /practice2
// are thin wrappers passing a BoothConfig. All state changes go through the
// API routes; gig ids are remembered in localStorage for /gigs history.

import { Press_Start_2P, VT323 } from "next/font/google";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CallPanel } from "@/components/CallPanel";
import type { Gig } from "@/lib/types";

const pixelHeading = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel-heading",
});

const pixelBody = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel-body",
});

export type BoothConfig = {
  personaId: string;
  clientName: string; // "MARCUS WEBB"
  clientShortName: string; // "MARCUS" — used in call status line
  idleBubble: string;
  reviseBubble: string;
  bubbles: Record<Gig["state"], string>;
  brief: { client: string; business: string; job: string; budget: string; deadline: string };
  portrait: { skin: string; hair: string; sweater: string };
};

export const GIG_IDS_KEY = "fc.gigIds";

function rememberGigId(id: string) {
  try {
    const ids = JSON.parse(localStorage.getItem(GIG_IDS_KEY) ?? "[]") as string[];
    if (!ids.includes(id)) ids.push(id);
    localStorage.setItem(GIG_IDS_KEY, JSON.stringify(ids));
  } catch {
    // localStorage unavailable — history page just stays empty
  }
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  const body = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
  return body;
}

export function PracticeBooth({ config }: { config: BoothConfig }) {
  const [gig, setGig] = useState<Gig | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState("");
  // Deliverable staged for preview — nothing is sent until SEND FOR REVIEW.
  const [staged, setStaged] = useState<{ name: string; dataUrl: string } | null>(null);
  const [dragging, setDragging] = useState(false);
  // Revision call finished; user chooses: resubmit or wrap up.
  const [revisionDone, setRevisionDone] = useState(false);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setBusy(false);
  }

  const refresh = async () => {
    if (!gig) return;
    setGig(await api<Gig>(`/api/gigs/${gig.id}`));
  };

  const clockIn = () =>
    run(async () => {
      const created = await api<Gig>("/api/gigs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personaId: config.personaId }),
      });
      setGig(created);
      rememberGigId(created.id);
    });

  const runItAgain = () => {
    setGig(null);
    setScope("");
    setStaged(null);
    setRevisionDone(false);
    setError(null);
  };

  const advance = (to: Gig["state"], extra?: Record<string, string>) =>
    run(async () => {
      if (!gig) return;
      setGig(
        await api<Gig>(`/api/gigs/${gig.id}/advance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to, ...extra }),
        }),
      );
    });

  // Stage only — read the file locally for preview; POST happens on submit.
  async function stageFile(file: File) {
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("could not read file"));
        reader.readAsDataURL(file);
      });
      setStaged({ name: file.name || "pasted image", dataUrl });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const submitLogo = () =>
    run(async () => {
      if (!gig || !staged) return;
      setGig(
        await api<Gig>(`/api/gigs/${gig.id}/submission`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageDataUrl: staged.dataUrl }),
        }),
      );
      setStaged(null);
    });

  // Ctrl+V anywhere on the page while the deliverable slot is open. Pasting
  // again replaces the staged image.
  const state = gig?.state;
  const stageFileRef = useRef(stageFile);
  const busyRef = useRef(busy);
  useEffect(() => {
    stageFileRef.current = stageFile;
    busyRef.current = busy;
  });
  useEffect(() => {
    if (state !== "working") return;
    const onPaste = (e: ClipboardEvent) => {
      if (busyRef.current) return;
      const item = Array.from(e.clipboardData?.items ?? []).find((i) =>
        i.type.startsWith("image/"),
      );
      const file = item?.getAsFile();
      if (file) void stageFileRef.current(file);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [state]);

  const evaluate = () =>
    run(async () => {
      if (!gig) return;
      await api(`/api/gigs/${gig.id}/evaluate`, { method: "POST" });
      await refresh();
    });

  const scorecard = gig?.scorecard;
  const button =
    "border-4 border-[#141111] px-5 py-2 font-[family-name:var(--font-pixel-heading)] text-[10px] tracking-widest shadow-[5px_5px_0_0_#141111] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50";

  return (
    <div
      className={`${pixelHeading.variable} ${pixelBody.variable} flex min-h-screen flex-col bg-[#1d1a1a] font-[family-name:var(--font-pixel-body)] text-[#d9d3c0]`}
    >
      {/* ---- Booth scene (top) ---- */}
      <section className="relative flex flex-1 items-center justify-center gap-8 overflow-hidden px-6 py-10">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "repeating-linear-gradient(to bottom, #2a2626 0px, #2a2626 38px, #383232 38px, #383232 40px)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            background:
              "repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, #000 3px)",
          }}
        />

        {/* client portrait */}
        <figure className="relative flex flex-col items-center">
          <div className="flex h-44 w-36 items-end justify-center overflow-hidden border-4 border-[#4a4340] bg-[#332e2c] shadow-[8px_8px_0_0_#141111]">
            <div className="flex flex-col items-center">
              <div className="relative h-12 w-12" style={{ backgroundColor: config.portrait.skin }}>
                <div className="absolute inset-x-1 top-0 h-1.5" style={{ backgroundColor: config.portrait.hair }} />
                <div className="absolute left-0 top-1 h-3 w-1.5" style={{ backgroundColor: config.portrait.hair }} />
                <div className="absolute right-0 top-1 h-3 w-1.5" style={{ backgroundColor: config.portrait.hair }} />
                <div className="absolute left-2 top-4 h-1 w-3 bg-[#4a4136]" />
                <div className="absolute right-2 top-4 h-1 w-3 bg-[#4a4136]" />
                <div className="absolute left-2.5 top-5.5 h-1.5 w-2 bg-[#1d1a1a]" />
                <div className="absolute right-2.5 top-5.5 h-1.5 w-2 bg-[#1d1a1a]" />
                <div className="absolute left-1/2 top-7 h-2.5 w-1.5 -translate-x-1/2 opacity-60" style={{ backgroundColor: config.portrait.hair }} />
                <div className="absolute bottom-0.5 left-1/2 h-1 w-3 -translate-x-1/2 bg-[#5c4a40]" />
              </div>
              <div className="h-2 w-6" style={{ backgroundColor: config.portrait.skin }} />
              <div className="h-14 w-24" style={{ backgroundColor: config.portrait.sweater }} />
            </div>
          </div>
          <figcaption className="mt-2 bg-[#141111] px-3 py-1 text-lg tracking-widest text-[#a89f8a]">
            {config.clientName}
          </figcaption>
        </figure>

        {/* speech bubble + call controls */}
        <div className="relative flex max-w-sm flex-col gap-4">
          <div className="relative">
            <div className="border-4 border-[#141111] bg-[#e8e0c9] p-4 text-2xl leading-7 text-[#3a3532] shadow-[8px_8px_0_0_#141111]">
              {!state
                ? config.idleBubble
                : state === "revision" && revisionDone
                  ? config.reviseBubble
                  : config.bubbles[state]}
            </div>
            <div className="absolute -left-3 top-8 h-6 w-6 rotate-45 border-b-4 border-l-4 border-[#141111] bg-[#e8e0c9]" />
          </div>

          {!gig && (
            <button type="button" disabled={busy} onClick={() => void clockIn()} className={`${button} self-start bg-[#c9a84c] text-[#141111]`}>
              CLOCK IN — START GIG
            </button>
          )}
          {gig && state === "briefing" && (
            <CallPanel
              gigId={gig.id}
              stage="briefing"
              clientShortName={config.clientShortName}
              onCallEnded={() => void advance("scoping", { detail: "briefing call ended" })}
            />
          )}
          {gig && state === "revision" && !revisionDone && (
            <CallPanel
              gigId={gig.id}
              stage="revision"
              clientShortName={config.clientShortName}
              onCallEnded={() => {
                setRevisionDone(true);
                void refresh();
              }}
            />
          )}
          {gig && state === "revision" && revisionDone && (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setRevisionDone(false);
                  setStaged(null);
                  void advance("working", { detail: "client requested changes" });
                }}
                className={`${button} bg-[#4a5a6e] text-[#e8e0c9]`}
              >
                SEND A REVISED VERSION
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setRevisionDone(false);
                  void advance("delivered", { detail: "revision call ended" });
                }}
                className={`${button} bg-[#c9a84c] text-[#141111]`}
              >
                WRAP UP — DELIVER
              </button>
            </div>
          )}
          {gig && state === "delivered" && !scorecard && (
            <button type="button" disabled={busy} onClick={() => void evaluate()} className={`${button} self-start bg-[#c9a84c] text-[#141111]`}>
              {busy ? "SCORING…" : "GET YOUR DEBRIEF"}
            </button>
          )}
          {error && <p className="text-lg leading-5 text-[#c96a4c]">{error}</p>}
        </div>
      </section>

      {/* ---- Divider band ---- */}
      <div className="flex h-8 items-center justify-center border-y-4 border-[#141111] bg-[#6e2b2b]">
        <span className="font-[family-name:var(--font-pixel-heading)] text-[10px] tracking-[0.3em] text-[#e8d9c0]">
          {(state ?? "off duty").toUpperCase()}
        </span>
      </div>

      {/* ---- Desk (bottom) ---- */}
      <section
        className="relative flex min-h-[45vh] flex-wrap items-center justify-center gap-10 px-6 py-10"
        style={{
          background:
            "repeating-linear-gradient(115deg, #575048 0px, #575048 6px, #524b44 6px, #524b44 12px)",
        }}
      >
        {/* gig brief — always on the desk once clocked in */}
        <article className="w-80 -rotate-1 border-2 border-[#b3a988] bg-[#e8e0c9] p-5 text-[#3a3532] shadow-[10px_10px_0_0_rgba(20,17,17,0.55)]">
          <h2 className="border-b-2 border-dashed border-[#8a7f60] pb-2 font-[family-name:var(--font-pixel-heading)] text-xs tracking-widest text-[#6e2b2b]">
            GIG BRIEF
          </h2>
          <dl className="mt-3 space-y-1 text-xl leading-6">
            <div className="flex justify-between gap-4"><dt className="text-[#8a7f60]">CLIENT</dt><dd>{config.brief.client}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[#8a7f60]">BUSINESS</dt><dd>{config.brief.business}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[#8a7f60]">JOB</dt><dd>{config.brief.job}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[#8a7f60]">BUDGET</dt><dd>{config.brief.budget}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[#8a7f60]">DEADLINE</dt><dd>{config.brief.deadline}</dd></div>
          </dl>
          <p className="mt-4 border-t-2 border-dashed border-[#8a7f60] pt-2 text-lg italic leading-5 text-[#6b6250]">
            &ldquo;Ask questions on the call. What you don&rsquo;t ask will come back to bite you.&rdquo;
          </p>
          <p className="mt-3 text-right text-sm tracking-widest text-[#8a7f60]">{gig?.id ?? "----"}</p>
        </article>

        {/* scope pad — scoping stage */}
        {gig && state === "scoping" && (
          <article className="w-80 rotate-1 border-2 border-[#9a938a] bg-[#f4f0e4] p-5 text-[#3a3532] shadow-[10px_10px_0_0_rgba(20,17,17,0.55)]">
            <h2 className="font-[family-name:var(--font-pixel-heading)] text-xs tracking-widest text-[#4a5a6e]">
              YOUR SCOPE
            </h2>
            <p className="mt-1 text-lg leading-5 text-[#8a7f60]">
              This is your contract. The client will hold you to it on the
              revision call, and your debrief scores it.
            </p>
            <textarea
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              rows={5}
              placeholder="What will you deliver, how many revisions, by when?"
              className="mt-3 w-full resize-none border-2 border-dashed border-[#c8c0aa] bg-transparent p-2 text-xl leading-6 outline-none placeholder:text-[#b3a988]"
            />
            <button
              type="button"
              disabled={busy || scope.trim().length < 10}
              onClick={() => void advance("working", { scope })}
              className={`${button} mt-3 bg-[#4a5a6e] text-[#e8e0c9]`}
            >
              SEND SCOPE
            </button>
          </article>
        )}

        {/* upload slot — working stage */}
        {gig && state === "working" && (
          <article className="w-80 rotate-1 border-2 border-[#9a938a] bg-[#f4f0e4] p-5 text-[#3a3532] shadow-[10px_10px_0_0_rgba(20,17,17,0.55)]">
            <h2 className="font-[family-name:var(--font-pixel-heading)] text-xs tracking-widest text-[#4a5a6e]">
              DELIVERABLE
            </h2>
            {!staged ? (
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const file = Array.from(e.dataTransfer.files).find(
                    (f) => f.type.startsWith("image/") || f.type === "application/pdf",
                  );
                  if (file && !busy) void stageFile(file);
                }}
                className={`mt-3 flex h-32 cursor-pointer items-center justify-center border-2 border-dashed px-2 text-center text-xl leading-6 ${
                  dragging
                    ? "border-[#4a5a6e] bg-[#e3ecf2] text-[#4a5a6e]"
                    : "border-[#c8c0aa] text-[#8a7f60]"
                }`}
              >
                {dragging
                  ? "DROP IT ON THE DESK"
                  : "DRAG & DROP · PASTE (CTRL+V) · CLICK TO BROWSE — PNG / JPG / SVG / PDF"}
                <input
                  type="file"
                  accept="image/*,.svg,application/pdf"
                  className="hidden"
                  disabled={busy}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void stageFile(file);
                    e.target.value = "";
                  }}
                />
              </label>
            ) : (
              <>
                {staged.dataUrl.startsWith("data:application/pdf") ? (
                  <div className="mt-3 flex h-32 items-center justify-center border-2 border-[#c8c0aa] bg-[#e8e0c9] text-center text-xl text-[#8a7f60]">
                    PDF DOCUMENT
                  </div>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element -- local data URL preview */
                  <img
                    src={staged.dataUrl}
                    alt="deliverable preview — not sent yet"
                    className="mt-3 w-full border-2 border-[#c8c0aa]"
                  />
                )}
                <p className="mt-1 truncate text-lg text-[#8a7f60]">
                  {staged.name} — not sent yet
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void submitLogo()}
                    className={`${button} bg-[#4a5a6e] text-[#e8e0c9]`}
                  >
                    {busy ? "CLIENT IS REVIEWING…" : "SEND FOR REVIEW"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setStaged(null)}
                    className={`${button} bg-[#8a7f60] text-[#141111]`}
                  >
                    CHANGE
                  </button>
                </div>
              </>
            )}
          </article>
        )}

        {/* submitted logo — visible from revision on */}
        {gig?.submission && (state === "revision" || state === "delivered") && (
          <article className="w-64 rotate-2 border-2 border-[#9a938a] bg-[#f4f0e4] p-4 shadow-[10px_10px_0_0_rgba(20,17,17,0.55)]">
            <h2 className="font-[family-name:var(--font-pixel-heading)] text-xs tracking-widest text-[#4a5a6e]">SUBMITTED</h2>
            {gig.submission.mimeType === "application/pdf" ? (
              <div className="mt-3 flex h-40 items-center justify-center border-2 border-[#c8c0aa] text-xl text-[#8a7f60]">
                PDF DOCUMENT
              </div>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element -- data URL, next/image not applicable */
              <img src={gig.submission.imageDataUrl} alt="your submitted logo" className="mt-3 w-full border-2 border-[#c8c0aa]" />
            )}
          </article>
        )}

        {/* scorecard — after debrief */}
        {gig && scorecard && (
          <article className="w-96 -rotate-1 border-2 border-[#b3a988] bg-[#e8e0c9] p-5 text-[#3a3532] shadow-[10px_10px_0_0_rgba(20,17,17,0.55)]">
            <h2 className="border-b-2 border-dashed border-[#8a7f60] pb-2 font-[family-name:var(--font-pixel-heading)] text-xs tracking-widest text-[#6e2b2b]">
              DEBRIEF — PRACTICE SCORECARD
            </h2>
            <dl className="mt-3 space-y-1 text-xl leading-6">
              {Object.entries(scorecard.process.scores).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-[#8a7f60]">{k.replace(/([A-Z])/g, " $1").toUpperCase()}</dt>
                  <dd>{"■".repeat(v)}{"□".repeat(5 - v)}</dd>
                </div>
              ))}
              {Object.entries(scorecard.speech.judgment.scores).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-[#8a7f60]">{k.toUpperCase()} (SPEECH)</dt>
                  <dd>{"■".repeat(v)}{"□".repeat(5 - v)}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-4">
                <dt className="text-[#8a7f60]">FILLER WORDS</dt>
                <dd>{scorecard.speech.metrics.fillerCount}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#8a7f60]">CLIENT SAYS</dt>
                <dd className="text-[#6e2b2b]">{scorecard.process.hireAgainSignal.toUpperCase()}</dd>
              </div>
            </dl>
            <p className="mt-4 border-t-2 border-dashed border-[#8a7f60] pt-2 text-lg leading-5">
              {scorecard.process.verdict}
            </p>

            <p className="mt-3 font-[family-name:var(--font-pixel-heading)] text-[9px] tracking-widest text-[#4a5a6e]">
              WHAT WORKED
            </p>
            <ul className="mt-1 space-y-1 text-lg leading-5">
              {scorecard.process.whatWorked.map((w, i) => (
                <li key={i}>+ {w}</li>
              ))}
            </ul>

            <p className="mt-3 font-[family-name:var(--font-pixel-heading)] text-[9px] tracking-widest text-[#6e2b2b]">
              WHAT DIDN&apos;T
            </p>
            <ul className="mt-1 space-y-1 text-lg leading-5">
              {scorecard.process.gaps.map((g, i) => (
                <li key={i}>&minus; {g}</li>
              ))}
            </ul>

            {scorecard.speech.judgment.notes.length > 0 && (
              <>
                <p className="mt-3 font-[family-name:var(--font-pixel-heading)] text-[9px] tracking-widest text-[#4a5a6e]">
                  HOW YOU SOUNDED
                </p>
                <ul className="mt-1 space-y-1 text-lg leading-5">
                  {scorecard.speech.judgment.notes.map((n, i) => (
                    <li key={i}>&bull; {n}</li>
                  ))}
                </ul>
              </>
            )}

            <p className="mt-3 border-t-2 border-dashed border-[#8a7f60] pt-2 text-lg leading-5 text-[#6e2b2b]">
              FIX FIRST: {scorecard.process.priorityFix}
            </p>
            <p className="mt-1 text-lg leading-5 text-[#6e2b2b]">
              SPEECH FIX: {scorecard.speech.judgment.priorityFix}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={`/gig/${gig.id}`}
                className={`${button} inline-block bg-[#4a5a6e] text-center text-[#e8e0c9]`}
              >
                VIEW GIG TRANSCRIPT
              </Link>
              <button
                type="button"
                onClick={runItAgain}
                className={`${button} bg-[#c9a84c] text-[#141111]`}
              >
                RUN IT AGAIN
              </button>
              <Link
                href="/gigs"
                className={`${button} inline-block bg-[#8a7f60] text-center text-[#141111]`}
              >
                HISTORY
              </Link>
            </div>
          </article>
        )}
      </section>

      {/* ---- HUD ---- */}
      <footer className="flex items-center justify-between border-t-4 border-[#141111] bg-[#171414] px-4 py-3 font-[family-name:var(--font-pixel-heading)] text-[10px] tracking-widest text-[#a89f8a]">
        <span>FIRSTCLIENT</span>
        <span className="text-[#c9a84c]">{config.brief.business.toUpperCase()} · {(state ?? "OFF DUTY").toUpperCase()}</span>
        <span className="text-[#7c8a6e]">PRACTICE MODE</span>
      </footer>
    </div>
  );
}
