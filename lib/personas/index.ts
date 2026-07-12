// Persona is data: adding one = a JSON file + a registry line here.

import { PersonaSchema, type Persona } from "@/lib/types";
import logoClient from "./logo-client.json";
import logoClientV2 from "./logo-client-v2.json";

const personas: Record<string, Persona> = {
  "logo-client-v1": PersonaSchema.parse(logoClient),
  "logo-client-v2": PersonaSchema.parse(logoClientV2),
};

export function getPersona(id: string): Persona {
  const persona = personas[id];
  if (!persona) throw new Error(`unknown persona: ${id}`);
  return persona;
}

export function isPersonaId(id: string): boolean {
  return id in personas;
}

export const DEFAULT_PERSONA_ID = "logo-client-v1";

// Each persona speaks through its own ElevenLabs agent.
export function agentEnvKeyForPersona(personaId: string): string {
  return personaId === "logo-client-v2"
    ? "ELEVENLABS_AGENT_ID_2"
    : "ELEVENLABS_AGENT_ID";
}
