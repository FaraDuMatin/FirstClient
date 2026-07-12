import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col items-center gap-8 py-24 text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-cyan-600 dark:text-cyan-500">
          FirstClient
        </p>
        
        <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl dark:text-zinc-50">
          Your first client.
        </h1>
        
        <p className="max-w-lg text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Rehearse the job before it counts. A flight simulator for freelancing:
          live briefing call, scoping, a real deliverable, a revision round, and
          an honest debrief with a client who reacts to your actual work.
        </p>
        <Link
          href="/practice"
          className="flex h-12 items-center rounded-full bg-zinc-900 px-8 text-base font-medium text-white dark:bg-zinc-50 dark:text-black"
        >
          Start a practice gig
        </Link>
        <p className="text-sm text-zinc-400 dark:text-zinc-600">
          Built at cuHacking 2026 &middot; under construction
        </p>
      </main>
    </div>
  );
}
