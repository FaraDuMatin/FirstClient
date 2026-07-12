// Demo insurance page. Reads the hand-seeded "demo-fallback" gig and links to
// its transcript page. Nothing here seeds or mutates anything.

import { Press_Start_2P, VT323 } from "next/font/google";
import Link from "next/link";
import { getGig } from "@/lib/db";

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

export default async function FallbackPage() {
  const gig = await getGig("demo-fallback");

  return (
    <div
      className={`${pixelHeading.variable} ${pixelBody.variable} flex min-h-screen flex-col items-center justify-center gap-8 bg-[#1d1a1a] px-6 font-[family-name:var(--font-pixel-body)] text-[#d9d3c0]`}
    >
      <p className="font-[family-name:var(--font-pixel-heading)] text-[10px] tracking-[0.3em] text-[#c9a84c]">
        DEMO INSURANCE — SEEDED GIG
      </p>

      {!gig ? (
        <div className="max-w-md border-4 border-[#141111] bg-[#e8e0c9] p-5 text-center text-2xl leading-7 text-[#3a3532] shadow-[8px_8px_0_0_#141111]">
          No seeded gig found. Run <span className="text-[#6e2b2b]">npm run seed</span> (needs
          MONGODB_URI in .env.local).
        </div>
      ) : (
        <>
          <article className="w-72 -rotate-1 border-2 border-[#b3a988] bg-[#e8e0c9] p-4 shadow-[10px_10px_0_0_rgba(20,17,17,0.55)]">
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL from db */}
            <img
              src={gig.submission?.imageDataUrl}
              alt="seeded deliverable"
              className="w-full border-2 border-[#c8c0aa]"
            />
            <p className="mt-2 text-center text-xl text-[#3a3532]">
              {gig.scorecard?.process.verdict}
            </p>
          </article>

          <Link
            href="/gig/demo-fallback"
            className="border-4 border-[#141111] bg-[#c9a84c] px-5 py-2 font-[family-name:var(--font-pixel-heading)] text-[10px] tracking-widest text-[#141111] shadow-[5px_5px_0_0_#141111]"
          >
            OPEN FULL GIG TRANSCRIPT
          </Link>
        </>
      )}
    </div>
  );
}
