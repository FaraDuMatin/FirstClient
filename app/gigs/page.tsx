"use client";

// /gigs — personal practice history. No accounts: gig ids live in
// localStorage (written by PracticeBooth on clock-in); details fetched from
// the db by id. Numeric scores per round for clarity.

import { Press_Start_2P, VT323 } from "next/font/google";
import Link from "next/link";
import { useEffect, useState } from "react";
import { GIG_IDS_KEY } from "@/components/PracticeBooth";
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

const PROCESS_COLS = ["clarifyingQuestions", "scopeDiscipline", "tone", "revisionHandling"] as const;
const SPEECH_COLS = ["clarity", "concision", "confidence", "professionalism"] as const;
const COL_LABELS: Record<string, string> = {
  clarifyingQuestions: "QUESTIONS",
  scopeDiscipline: "SCOPE",
  tone: "TONE",
  revisionHandling: "REVISION",
  clarity: "CLARITY",
  concision: "CONCISION",
  confidence: "CONFIDENCE",
  professionalism: "PROFESSIONAL",
};

export default function GigsHistory() {
  const [gigs, setGigs] = useState<Gig[] | null>(null);

  useEffect(() => {
    let ids: string[] = [];
    try {
      ids = JSON.parse(localStorage.getItem(GIG_IDS_KEY) ?? "[]") as string[];
    } catch {
      // corrupted storage -> empty history
    }
    if (!ids.length) {
      setGigs([]);
      return;
    }
    void Promise.allSettled(
      ids.map((id) => fetch(`/api/gigs/${id}`).then((r) => (r.ok ? (r.json() as Promise<Gig>) : null))),
    ).then((results) => {
      const found = results
        .map((r) => (r.status === "fulfilled" ? r.value : null))
        .filter((g): g is Gig => g !== null)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      setGigs(found);
    });
  }, []);

  return (
    <div
      className={`${pixelHeading.variable} ${pixelBody.variable} min-h-screen bg-[#1d1a1a] px-6 py-10 font-[family-name:var(--font-pixel-body)] text-[#d9d3c0]`}
    >
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-8">
        <header className="text-center">
          <p className="font-[family-name:var(--font-pixel-heading)] text-[10px] tracking-[0.3em] text-[#c9a84c]">
            YOUR PRACTICE HISTORY
          </p>
          <p className="mt-2 text-xl text-[#8a7f60]">
            Stored on this browser only — no account, no tracking.
          </p>
        </header>

        {gigs === null && <p className="animate-pulse text-2xl">LOADING…</p>}

        {gigs?.length === 0 && (
          <div className="border-4 border-[#141111] bg-[#e8e0c9] p-5 text-center text-2xl text-[#3a3532] shadow-[8px_8px_0_0_#141111]">
            No rounds yet on this browser.{" "}
            <Link href="/practice" className="text-[#6e2b2b] underline">
              Clock in.
            </Link>
          </div>
        )}

        {!!gigs?.length && (
          <div className="w-full overflow-x-auto border-2 border-[#b3a988] bg-[#e8e0c9] p-5 text-[#3a3532] shadow-[10px_10px_0_0_rgba(20,17,17,0.55)]">
            <table className="w-full text-left text-xl leading-6">
              <thead>
                <tr className="border-b-2 border-dashed border-[#8a7f60] font-[family-name:var(--font-pixel-heading)] text-[8px] tracking-widest text-[#8a7f60]">
                  <th className="pb-2 pr-3">ROUND</th>
                  <th className="pb-2 pr-3">CLIENT</th>
                  {PROCESS_COLS.map((c) => (
                    <th key={c} className="pb-2 pr-3 text-[#6e2b2b]">{COL_LABELS[c]}</th>
                  ))}
                  {SPEECH_COLS.map((c) => (
                    <th key={c} className="pb-2 pr-3 text-[#4a5a6e]">{COL_LABELS[c]}</th>
                  ))}
                  <th className="pb-2 pr-3">CLIENT SAYS</th>
                  <th className="pb-2">&nbsp;</th>
                </tr>
              </thead>
              <tbody>
                {gigs.map((g, i) => (
                  <tr key={g.id} className="border-b border-[#c8c0aa] align-top">
                    <td className="py-2 pr-3">
                      #{i + 1}
                      <span className="block text-sm text-[#8a7f60]">
                        {new Date(g.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-2 pr-3">{g.personaId === "logo-client-v2" ? "Priya" : "Marcus"}</td>
                    {PROCESS_COLS.map((c) => (
                      <td key={c} className="py-2 pr-3 text-2xl">
                        {g.scorecard ? `${g.scorecard.process.scores[c]}/5` : "—"}
                      </td>
                    ))}
                    {SPEECH_COLS.map((c) => (
                      <td key={c} className="py-2 pr-3 text-2xl">
                        {g.scorecard ? `${g.scorecard.speech.judgment.scores[c]}/5` : "—"}
                      </td>
                    ))}
                    <td className="py-2 pr-3">
                      {g.scorecard?.process.hireAgainSignal ?? `(${g.state})`}
                    </td>
                    <td className="py-2">
                      <Link href={`/gig/${g.id}`} className="text-[#4a5a6e] underline">
                        transcript
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Link
          href="/practice"
          className="border-4 border-[#141111] bg-[#c9a84c] px-5 py-2 font-[family-name:var(--font-pixel-heading)] text-[10px] tracking-widest text-[#141111] shadow-[5px_5px_0_0_#141111]"
        >
          RUN ANOTHER ROUND
        </Link>
      </div>
    </div>
  );
}
