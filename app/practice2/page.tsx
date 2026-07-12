// /practice2 — Sarah Shah, the harder v2 client (unlinked; go here manually).
// Needs ELEVENLABS_AGENT_ID_2 in env. Traps: no red, exact "Juniper & Thorn"
// wordmark, and she WILL try to scope-creep a free extra on the revision call.

import { PracticeBooth, type BoothConfig } from "@/components/PracticeBooth";

const SARAH: BoothConfig = {
  personaId: "logo-client-v2",
  clientName: "SARAH SHAH",
  clientShortName: "SARAH",
  idleBubble:
    "Round two. This client is faster, sharper, and will test your scope. Clock in.",
  reviseBubble:
    "Send a fixed version — or wrap it up if you're sure. She doesn't wait twice.",
  bubbles: {
    briefing:
      "Hi — I have maybe ten minutes. Juniper and Thorn, we make candles, our logo is a disaster. Answer when you're ready.",
    scoping:
      "Scope. In writing. And don't pad it — I read fast and I remember everything.",
    working: "Send the file the second it's done. I'll open it immediately.",
    revision: "I opened your file. I have thoughts. Pick up.",
    delivered: "Done. Read your debrief — I said what I said.",
  },
  brief: {
    client: "Sarah Shah",
    business: "Juniper & Thorn",
    job: "Logo rebrand",
    budget: "Decent",
    deadline: "Pop-up soon",
  },
  portrait: { skin: "#a08668", hair: "#141111", sweater: "#7F8A71" },
};

export default function Practice2() {
  return <PracticeBooth config={SARAH} />;
}
