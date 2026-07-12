// /practice — look only, zero logic. Papers, Please-INSPIRED (booth/desk split,
// pixel type, paper documents), not a copy: this is a practice booth for soft
// skills, not a border checkpoint.

import { Press_Start_2P, VT323 } from "next/font/google";

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

export default function Practice() {
  return (
    <div
      className={`${pixelHeading.variable} ${pixelBody.variable} flex min-h-screen flex-col bg-[#1d1a1a] font-[family-name:var(--font-pixel-body)] text-[#d9d3c0]`}
    >
      {/* ---- Booth scene (top) ---- */}
      <section className="relative flex flex-1 items-center justify-center gap-8 overflow-hidden px-6 py-10">
        {/* height-chart wall, like a lineup backdrop */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "repeating-linear-gradient(to bottom, #2a2626 0px, #2a2626 38px, #383232 38px, #383232 40px)",
          }}
        />
        {/* subtle scanlines over the whole scene */}
        <div
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            background:
              "repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, #000 3px)",
          }}
        />

        {/* client portrait window */}
        <figure className="relative flex flex-col items-center">
          <div className="flex h-44 w-36 items-end justify-center overflow-hidden border-4 border-[#4a4340] bg-[#332e2c] shadow-[8px_8px_0_0_#141111]">
            {/* blocky pixel face: hair, brows, eyes, nose, mustache, mouth */}
            <div className="flex flex-col items-center">
              <div className="relative h-12 w-12 bg-[#7c8a6e]">
                {/* hair: top + receding sides */}
                <div className="absolute inset-x-1 top-0 h-1.5 bg-[#3a3028]" />
                <div className="absolute left-0 top-1 h-3 w-1.5 bg-[#3a3028]" />
                <div className="absolute right-0 top-1 h-3 w-1.5 bg-[#3a3028]" />
                {/* brows */}
                <div className="absolute left-2 top-4 h-1 w-3 bg-[#4a4136]" />
                <div className="absolute right-2 top-4 h-1 w-3 bg-[#4a4136]" />
                {/* eyes */}
                <div className="absolute left-2.5 top-5.5 h-1.5 w-2 bg-[#1d1a1a]" />
                <div className="absolute right-2.5 top-5.5 h-1.5 w-2 bg-[#1d1a1a]" />
                {/* nose shadow */}
                <div className="absolute left-1/2 top-7 h-2.5 w-1.5 -translate-x-1/2 bg-[#6a765e]" />
                {/* mustache */}
                <div className="absolute left-1/2 top-9.5 h-1.5 w-5 -translate-x-1/2 bg-[#4a4136]" />
                {/* mouth */}
                <div className="absolute bottom-0.5 left-1/2 h-1 w-3 -translate-x-1/2 bg-[#5c4a40]" />
              </div>
              {/* neck + red sweater shoulders */}
              <div className="h-2 w-6 bg-[#71805f]" />
              <div className="h-14 w-24 bg-[#6e2b2b]" />
            </div>
          </div>
          <figcaption className="mt-2 bg-[#141111] px-3 py-1 text-lg tracking-widest text-[#a89f8a]">
            MARCUS WEBB
          </figcaption>
        </figure>

        {/* speech bubble */}
        <div className="relative max-w-sm">
          <div className="border-4 border-[#141111] bg-[#e8e0c9] p-4 text-2xl leading-7 text-[#3a3532] shadow-[8px_8px_0_0_#141111]">
            So — Beanhound. We roast coffee, small batches, and our logo is
            embarrassing. Where do you want to start?
          </div>
          {/* bubble tail */}
          <div className="absolute -left-3 top-8 h-6 w-6 rotate-45 border-b-4 border-l-4 border-[#141111] bg-[#e8e0c9]" />
        </div>
      </section>

      {/* ---- Divider band ---- */}
      <div className="flex h-8 items-center justify-center border-y-4 border-[#141111] bg-[#6e2b2b]">
        <span className="font-[family-name:var(--font-pixel-heading)] text-[10px] tracking-[0.3em] text-[#e8d9c0]">
          BRIEFING CALL
        </span>
      </div>

      {/* ---- Desk (bottom) ---- */}
      <section
        className="relative flex min-h-[45vh] items-center justify-center gap-10 px-6 py-10"
        style={{
          background:
            "repeating-linear-gradient(115deg, #575048 0px, #575048 6px, #524b44 6px, #524b44 12px)",
        }}
      >
        {/* gig brief document */}
        <article className="w-80 -rotate-1 border-2 border-[#b3a988] bg-[#e8e0c9] p-5 text-[#3a3532] shadow-[10px_10px_0_0_rgba(20,17,17,0.55)]">
          <h2 className="border-b-2 border-dashed border-[#8a7f60] pb-2 font-[family-name:var(--font-pixel-heading)] text-xs tracking-widest text-[#6e2b2b]">
            GIG BRIEF
          </h2>
          <dl className="mt-3 space-y-1 text-xl leading-6">
            <div className="flex justify-between gap-4">
              <dt className="text-[#8a7f60]">CLIENT</dt>
              <dd>Marcus Webb</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#8a7f60]">BUSINESS</dt>
              <dd>Beanhound Coffee</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#8a7f60]">JOB</dt>
              <dd>Logo design</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#8a7f60]">BUDGET</dt>
              <dd>Small</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#8a7f60]">DEADLINE</dt>
              <dd>Fast</dd>
            </div>
          </dl>
          <p className="mt-4 border-t-2 border-dashed border-[#8a7f60] pt-2 text-lg italic leading-5 text-[#6b6250]">
            &ldquo;Something warm and handmade. Maybe a dog? I&rsquo;ll know it
            when I see it.&rdquo;
          </p>
          <p className="mt-3 text-right text-sm tracking-widest text-[#8a7f60]">
            8733H-P1410
          </p>
        </article>

        {/* notepad — where the freelancer's questions/scope will live later */}
        <article className="hidden w-64 rotate-1 border-2 border-[#9a938a] bg-[#f4f0e4] p-5 text-[#3a3532] shadow-[10px_10px_0_0_rgba(20,17,17,0.55)] sm:block">
          <h2 className="font-[family-name:var(--font-pixel-heading)] text-xs tracking-widest text-[#4a5a6e]">
            YOUR NOTES
          </h2>
          <ul className="mt-3 space-y-2 text-xl leading-6 text-[#6b6250]">
            <li className="border-b border-[#c8c0aa]">— ask about colors?</li>
            <li className="border-b border-[#c8c0aa]">— what text in logo?</li>
            <li className="border-b border-[#c8c0aa]">— deadline, formats</li>
            <li className="border-b border-[#c8c0aa]">&nbsp;</li>
          </ul>
        </article>
      </section>

      {/* ---- Status bar (HUD) ---- */}
      <footer className="flex items-center justify-between border-t-4 border-[#141111] bg-[#171414] px-4 py-3 font-[family-name:var(--font-pixel-heading)] text-[10px] tracking-widest text-[#a89f8a]">
        <span>FIRSTCLIENT</span>
        <span className="text-[#c9a84c]">DAY 1 · BRIEFING</span>
        <span className="text-[#7c8a6e]">PRACTICE MODE</span>
      </footer>
    </div>
  );
}
