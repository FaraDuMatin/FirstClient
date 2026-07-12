// Landing page — same pixel/paper language as /practice, brand palette from
// public/logo.png: brick #662F2D, sage #7F8A71, dark brown #383029.

import { Press_Start_2P, VT323 } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { ShaderBackground } from "@/components/ShaderBackground";

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

const STEPS = [
  {
    n: "01",
    title: "ANSWER THE CALL",
    text: "A live client briefs you — imperfectly, like real clients do. What you don't ask will come back to bite you.",
    rotate: "-rotate-2",
  },
  {
    n: "02",
    title: "SCOPE IT",
    text: "Say what you'll deliver, how many revisions, by when. In writing, before you touch the work.",
    rotate: "rotate-1",
  },
  {
    n: "03",
    title: "DO THE WORK",
    text: "Submit the real file. The client actually looks at it: colors, text, style, everything.",
    rotate: "-rotate-1",
  },
  {
    n: "04",
    title: "TAKE THE HEAT",
    text: "A revision call about YOUR file, then a debrief that quotes your own words back at you.",
    rotate: "rotate-2",
  },
];

export default function Home() {
  return (
    <div
      className={`${pixelHeading.variable} ${pixelBody.variable} flex min-h-screen flex-col bg-[#1d1a1a] font-[family-name:var(--font-pixel-body)] text-[#d9d3c0]`}
    >
      {/* ---- Hero ---- */}
      <section className="relative flex flex-col items-center gap-6 overflow-hidden px-6 pb-16 pt-20 text-center">
        {/* background shader — native WebGL port of shadertoy.com/view/NcdGD8 */}
        <ShaderBackground />
        <div
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            background:
              "repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, #000 3px)",
          }}
        />
        <Image
          src="/logo.png"
          alt="FirstClient logo"
          width={96}
          height={96}
          priority
          className="relative"
        />
        <p className="relative font-[family-name:var(--font-pixel-heading)] text-[10px] tracking-[0.35em] text-[#c9a84c]">
          FIRSTCLIENT
        </p>
        <h1 className="relative max-w-2xl text-5xl leading-tight tracking-wide sm:text-6xl">
          Your first client.
        </h1>
        <p className="relative max-w-xl text-2xl leading-8 text-[#a89f8a]">
          A flight simulator for freelancing. Take a complete gig — live client
          call, scope, real deliverable, revision, debrief — before your first
          real one.
        </p>
        <Link
          href="/practice"
          className="relative border-4 border-[#141111] bg-[#c9a84c] px-8 py-3 font-[family-name:var(--font-pixel-heading)] text-[11px] tracking-widest text-[#141111] shadow-[6px_6px_0_0_#141111] transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          START A PRACTICE GIG
        </Link>
      </section>

      {/* ---- Who it's for ---- */}
      <section className="border-y-4 border-[#141111] bg-[#662F2D] px-6 py-10 text-center">
        <p className="mx-auto max-w-2xl text-2xl leading-8 text-[#e8d9c0]">
          For every self-taught designer and developer with real skill, zero
          history, and nobody to practice on. The market gives no rehearsal
          runs. Practice the job. Keep the transcript. Walk
          in ready.
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-xl leading-7 text-[#c9a184]">
          Can also be used as client-communication rehearsal for junior teams in
          corporate onboarding.
        </p>
      </section>

      {/* ---- Steps (paper cards on desk) ---- */}
      <section
        className="flex flex-wrap items-stretch justify-center gap-8 px-6 py-14"
        style={{
          background:
            "repeating-linear-gradient(115deg, #383029 0px, #383029 6px, #332c26 6px, #332c26 12px)",
        }}
      >
        {STEPS.map((s) => (
          <article
            key={s.n}
            className={`w-64 ${s.rotate} border-2 border-[#b3a988] bg-[#e8e0c9] p-5 text-[#3a3532] shadow-[10px_10px_0_0_rgba(20,17,17,0.55)]`}
          >
            <p className="font-[family-name:var(--font-pixel-heading)] text-[9px] tracking-widest text-[#7F8A71]">
              {s.n}
            </p>
            <h2 className="mt-2 border-b-2 border-dashed border-[#8a7f60] pb-2 font-[family-name:var(--font-pixel-heading)] text-[11px] tracking-widest text-[#662F2D]">
              {s.title}
            </h2>
            <p className="mt-3 text-xl leading-6">{s.text}</p>
          </article>
        ))}
      </section>

      {/* ---- Pilot line ---- */}
      <section className="border-t-4 border-[#141111] bg-[#171414] px-6 py-12 text-center">
        <blockquote className="mx-auto max-w-xl text-2xl leading-8 text-[#7F8A71]">
          &ldquo;Pilots don&rsquo;t show simulator hours to passengers. They use
          them to not crash on flight&nbsp;#1.&rdquo;
        </blockquote>
        <Link
          href="/practice"
          className="mt-8 inline-block border-4 border-[#141111] bg-[#7F8A71] px-6 py-2 font-[family-name:var(--font-pixel-heading)] text-[10px] tracking-widest text-[#141111] shadow-[5px_5px_0_0_#141111]"
        >
          CLOCK IN
        </Link>
      </section>

      {/* ---- Footer ---- */}
      <footer className="flex items-center justify-between border-t-4 border-[#141111] bg-[#141111] px-4 py-3 font-[family-name:var(--font-pixel-heading)] text-[9px] tracking-widest text-[#8a7f60]">
        <span>FIRSTCLIENT</span>
        <span>BUILT AT CUHACKING 2026</span>
        <span className="text-[#7F8A71]">PRACTICE MODE</span>
      </footer>
    </div>
  );
}
