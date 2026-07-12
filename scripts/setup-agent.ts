// Creates (or updates) a persona's ElevenLabs agent entirely by API — no
// dashboard clicking. Critically, it enables per-session overrides for
// prompt + first_message, which the revision-call mechanic depends on.
// Run: npm run setup:agent            (Marcus, ELEVENLABS_AGENT_ID)
//      npm run setup:agent -- logo-client-v2   (Priya, ELEVENLABS_AGENT_ID_2)

import { buildBriefingPrompt } from "../lib/agent/prompt";
import { getConversationToken } from "../lib/elevenlabs";
import { agentEnvKeyForPersona, getPersona, DEFAULT_PERSONA_ID } from "../lib/personas";

try {
  process.loadEnvFile(".env.local");
} catch {
  // fall through to process env
}

const BASE = "https://api.elevenlabs.io";
const PERSONA_ID = process.argv[2] ?? DEFAULT_PERSONA_ID;
const AGENT_ENV_KEY = agentEnvKeyForPersona(PERSONA_ID);
// Premade ElevenLabs voices: George (warm middle-aged male) for Marcus,
// Jessica (crisp adult female) for Priya. Swap freely.
const VOICE_ID = PERSONA_ID === "logo-client-v2" ? "cgSgspJ2msm6clMCkdW9" : "JBFqnCBsd6RMkjVDRZzb";

function agentBody() {
  const persona = getPersona(PERSONA_ID);
  return {
    name: `FirstClient — ${persona.name} (${persona.business})`,
    conversation_config: {
      agent: {
        language: "en",
        first_message: persona.firstMessageBriefing,
        prompt: {
          prompt: buildBriefingPrompt(persona),
          // Lets Marcus hang up on his own once the business is concluded.
          built_in_tools: {
            end_call: {
              name: "end_call",
              description: "",
              response_timeout_secs: 20,
              type: "system",
              params: { system_tool_type: "end_call" },
            },
          },
        },
      },
      tts: {
        voice_id: VOICE_ID,
      },
    },
    platform_settings: {
      overrides: {
        conversation_config_override: {
          agent: {
            prompt: { prompt: true },
            first_message: true,
          },
        },
      },
    },
  };
}

async function main() {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    console.log("[FAIL] ELEVENLABS_API_KEY not set");
    process.exitCode = 1;
    return;
  }
  const headers = { "xi-api-key": key, "Content-Type": "application/json" };
  console.log(`[..] persona: ${PERSONA_ID} -> env ${AGENT_ENV_KEY}`);
  const existingId = process.env[AGENT_ENV_KEY];

  let agentId: string;
  if (existingId) {
    const res = await fetch(`${BASE}/v1/convai/agents/${existingId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(agentBody()),
    });
    if (!res.ok) {
      console.log(`[FAIL] update agent: HTTP ${res.status}: ${(await res.text()).slice(0, 400)}`);
      process.exitCode = 1;
      return;
    }
    agentId = existingId;
    console.log(`[OK] agent updated: ${agentId}`);
  } else {
    const res = await fetch(`${BASE}/v1/convai/agents/create`, {
      method: "POST",
      headers,
      body: JSON.stringify(agentBody()),
    });
    if (!res.ok) {
      console.log(`[FAIL] create agent: HTTP ${res.status}: ${(await res.text()).slice(0, 400)}`);
      process.exitCode = 1;
      return;
    }
    const body = (await res.json()) as { agent_id?: string };
    if (!body.agent_id) {
      console.log(`[FAIL] create agent: no agent_id in response`);
      process.exitCode = 1;
      return;
    }
    agentId = body.agent_id;
    console.log(`[OK] agent created: ${agentId}`);
    console.log(`\n>>> add this line to .env.local (and Vercel env):\n${AGENT_ENV_KEY}=${agentId}\n`);
  }

  // Token round trip proves the browser voice path is ready.
  process.env[AGENT_ENV_KEY] = agentId;
  try {
    const token = await getConversationToken(AGENT_ENV_KEY);
    console.log(`[OK] WebRTC conversation token minted (${token.slice(0, 12)}...)`);
  } catch (e) {
    console.log(`[FAIL] token round trip: ${e instanceof Error ? e.message.slice(0, 300) : e}`);
    process.exitCode = 1;
  }
}

void main();
