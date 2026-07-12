// Gig transcript portfolio page — public, no auth. Deliverable, timeline,
// both call transcripts, scorecard verdict. Reads the gig straight from db.

import { Press_Start_2P, VT323 } from "next/font/google";
import Link from "next/link";
import { getGig } from "@/lib/db";
import type { TranscriptTurn } from "@/lib/types";

export const dynamic = "force-dynamic";

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

const paper =
  "w-full border-2 border-[#b3a988] bg-[#e8e0c9] p-5 text-[#3a3532] shadow-[10px_10px_0_0_rgba(20,17,17,0.55)]";
const paperTitle =
  "border-b-2 border-dashed border-[#8a7f60] pb-2 font-[family-name:var(--font-pixel-heading)] text-xs tracking-widest text-[#6e2b2b]";

function Transcript({
  title,
  turns,
}: {
  title: string;
  turns: TranscriptTurn[] | undefined;
}) {
  return (
    <article className={paper}>
      <h2 className={paperTitle}>{title}</h2>
      {turns?.length ? (
        <ul className="mt-3 space-y-2 text-xl leading-6">
          {turns.map((t, i) => (
            <li key={i}>
              <span
                className={
                  t.role === "user"
                    ? "font-[family-name:var(--font-pixel-heading)] text-[9px] text-[#4a5a6e]"
                    : "font-[family-name:var(--font-pixel-heading)] text-[9px] text-[#6e2b2b]"
                }
              >
                {t.role === "user" ? "FREELANCER " : "CLIENT "}
              </span>
              {t.message}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xl text-[#8a7f60]">No transcript recorded for this call.</p>
      )}
    </article>
  );
}

export default async function GigTranscriptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const gig = await getGig(id);

  if (!gig) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1d1a1a] font-mono text-[#d9d3c0]">
        Gig not found.
      </div>
    );
  }

  return (
    <div
      className={`${pixelHeading.variable} ${pixelBody.variable} min-h-screen bg-[#1d1a1a] px-6 py-10 font-[family-name:var(--font-pixel-body)] text-[#d9d3c0]`}
    >
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-8">
        <header className="text-center">
          <p className="font-[family-name:var(--font-pixel-heading)] text-[10px] tracking-[0.3em] text-[#c9a84c]">
            GIG TRANSCRIPT — PRACTICE ARTIFACT
          </p>
          <h1 className="mt-3 text-3xl tracking-widest">
            BEANHOUND LOGO GIG · {gig.id.toUpperCase()}
          </h1>
        </header>

        {gig.submission && (
          <article className={`${paper} max-w-xs`}>
            <h2 className={paperTitle}>DELIVERABLE</h2>
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL from db */}
            <img
              src={gig.submission.imageDataUrl}
              alt="submitted logo"
              className="mt-3 w-full border-2 border-[#c8c0aa]"
            />
          </article>
        )}

        {gig.scope && (
          <article className={paper}>
            <h2 className={paperTitle}>AGREED SCOPE</h2>
            <p className="mt-3 text-xl leading-6">{gig.scope}</p>
          </article>
        )}

        <article className={paper}>
          <h2 className={paperTitle}>TIMELINE</h2>
          <ul className="mt-3 space-y-1 text-xl leading-6">
            {gig.events.map((e, i) => (
              <li key={i} className="flex justify-between gap-4">
                <span>{e.type.toUpperCase()}{e.detail ? ` — ${e.detail}` : ""}</span>
                <span className="shrink-0 text-[#8a7f60]">
                  {new Date(e.at).toLocaleTimeString()}
                </span>
              </li>
            ))}
          </ul>
        </article>

        <Transcript title="BRIEFING CALL" turns={gig.conversations.briefing?.transcript} />
        <Transcript title="REVISION CALL" turns={gig.conversations.revision?.transcript} />

        {gig.scorecard && (
          <article className={paper}>
            <h2 className={paperTitle}>DEBRIEF VERDICT</h2>
            <p className="mt-3 text-xl leading-6">{gig.scorecard.process.verdict}</p>
            {/* old gigs scored before hireAgainSignal existed may lack it */}
            {gig.scorecard.process.hireAgainSignal && (
              <p className="mt-2 text-xl leading-6 text-[#6e2b2b]">
                CLIENT SAYS: {gig.scorecard.process.hireAgainSignal.toUpperCase()}
              </p>
            )}
          </article>
        )}

        <Link
          href="/practice"
          className="border-4 border-[#141111] bg-[#c9a84c] px-5 py-2 font-[family-name:var(--font-pixel-heading)] text-[10px] tracking-widest text-[#141111] shadow-[5px_5px_0_0_#141111]"
        >
          BACK TO THE BOOTH
        </Link>
      </div>
    </div>
  );
}
