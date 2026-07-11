// Persona is data: exactly one in v1, structured so a second persona is a new
// JSON file, not a refactor.

import { PersonaSchema, type Persona } from "@/lib/types";
import logoClient from "./logo-client.json";

const personas: Record<string, Persona> = {
  "logo-client-v1": PersonaSchema.parse(logoClient),
};

export function getPersona(id: string): Persona {
  const persona = personas[id];
  if (!persona) throw new Error(`unknown persona: ${id}`);
  return persona;
}

export const DEFAULT_PERSONA_ID = "logo-client-v1";
