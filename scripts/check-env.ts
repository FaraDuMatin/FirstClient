// One-shot setup check: pings each third-party service with the keys in
// .env.local and prints pass/fail. No app logic. Run: npm run check

import { GoogleGenAI } from "@google/genai";
import { MongoClient } from "mongodb";

try {
  process.loadEnvFile(".env.local");
} catch {
  console.log("(!) no .env.local found — checking process env only");
}

function ok(name: string, detail: string) {
  console.log(`  [OK]   ${name} — ${detail}`);
}
function fail(name: string, detail: string) {
  console.log(`  [FAIL] ${name} — ${detail}`);
}
function skip(name: string, envVar: string) {
  console.log(`  [SKIP] ${name} — ${envVar} not set`);
}

async function checkGemini(): Promise<void> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return skip("Gemini", "GEMINI_API_KEY");
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const interaction = await ai.interactions.create({
      model: "gemini-3.5-flash",
      input: "Reply with the single word: pong",
    });
    ok("Gemini", `model answered: "${(interaction.output_text ?? "").trim().slice(0, 40)}"`);
  } catch (e) {
    fail("Gemini", e instanceof Error ? e.message.slice(0, 200) : String(e));
  }
}

async function checkElevenLabs(): Promise<void> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return skip("ElevenLabs", "ELEVENLABS_API_KEY");
  try {
    // Agents-scoped endpoint (matches the restricted key's ElevenAgents scope).
    const res = await fetch("https://api.elevenlabs.io/v1/convai/agents", {
      headers: { "xi-api-key": key },
    });
    if (!res.ok) {
      fail("ElevenLabs", `HTTP ${res.status}: ${(await res.text()).slice(0, 150)}`);
      return;
    }
    const body = (await res.json()) as { agents?: unknown[] };
    const count = body.agents?.length ?? 0;
    ok("ElevenLabs", `key valid, ${count} agent(s) in workspace`);
    if (!process.env.ELEVENLABS_AGENT_ID) {
      console.log("         note: ELEVENLABS_AGENT_ID still empty (expected — agent not created yet)");
    }
  } catch (e) {
    fail("ElevenLabs", e instanceof Error ? e.message.slice(0, 200) : String(e));
  }
}

async function checkMongo(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) return skip("MongoDB Atlas", "MONGODB_URI");
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
  try {
    await client.connect();
    await client.db("firstclient").command({ ping: 1 });
    ok("MongoDB Atlas", "connected + ping to db 'firstclient'");
  } catch (e) {
    fail("MongoDB Atlas", e instanceof Error ? e.message.slice(0, 200) : String(e));
  } finally {
    await client.close().catch(() => undefined);
  }
}

async function main() {
  console.log("FirstClient setup check\n");
  await checkGemini();
  await checkElevenLabs();
  await checkMongo();
  console.log("\ndone");
}

void main();
