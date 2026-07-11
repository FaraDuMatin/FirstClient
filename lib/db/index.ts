// Single data module (CLAUDE.md rule). MongoDB Atlas when MONGODB_URI is set;
// otherwise an in-memory Map so `npm run dev` works with zero keys. The map is
// cached on globalThis to survive Next.js dev-server hot reloads.

import { MongoClient, type Collection } from "mongodb";
import type { Gig } from "@/lib/types";

const DB_NAME = "firstclient";

type GlobalCache = {
  __firstclientMemGigs?: Map<string, Gig>;
  __firstclientMongo?: Promise<MongoClient>;
};
const globalCache = globalThis as unknown as GlobalCache;

function memGigs(): Map<string, Gig> {
  globalCache.__firstclientMemGigs ??= new Map();
  return globalCache.__firstclientMemGigs;
}

function mongoUri(): string | undefined {
  return process.env.MONGODB_URI || undefined;
}

async function gigsCollection(): Promise<Collection<Gig>> {
  const uri = mongoUri();
  if (!uri) throw new Error("gigsCollection called without MONGODB_URI");
  globalCache.__firstclientMongo ??= new MongoClient(uri).connect();
  const client = await globalCache.__firstclientMongo;
  return client.db(DB_NAME).collection<Gig>("gigs");
}

export async function createGig(gig: Gig): Promise<void> {
  await saveGig(gig);
}

export async function saveGig(gig: Gig): Promise<void> {
  if (!mongoUri()) {
    memGigs().set(gig.id, gig);
    return;
  }
  const col = await gigsCollection();
  await col.updateOne({ id: gig.id }, { $set: gig }, { upsert: true });
}

export async function getGig(id: string): Promise<Gig | null> {
  if (!mongoUri()) {
    return memGigs().get(id) ?? null;
  }
  const col = await gigsCollection();
  const doc = await col.findOne({ id }, { projection: { _id: 0 } });
  return doc as Gig | null;
}

export async function listGigs(): Promise<Gig[]> {
  if (!mongoUri()) {
    return [...memGigs().values()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }
  const col = await gigsCollection();
  const docs = await col
    .find({}, { projection: { _id: 0 } })
    .sort({ createdAt: -1 })
    .toArray();
  return docs as Gig[];
}
