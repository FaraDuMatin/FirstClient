# FirstClient

**Your first client is an AI. Rehearse the job before it counts.**

A practice environment for new freelancers: complete a full gig — live voice
briefing, scoping, a real deliverable, a revision call, and a debrief — with a
realistic AI client, before your first real one.

Built at cuHacking 2026.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- ElevenLabs Agents (voice)
- Gemini API (vision + evaluation)
- MongoDB Atlas

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in keys (app runs without them, degraded)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script          | What it does                |
| --------------- | --------------------------- |
| `npm run dev`   | local dev server            |
| `npm run build` | production build            |
| `npm run lint`  | eslint                      |
