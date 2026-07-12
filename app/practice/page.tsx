// /practice — Marcus Webb, the v1 client. All booth logic lives in
// components/PracticeBooth.tsx.

import { PracticeBooth, type BoothConfig } from "@/components/PracticeBooth";

const MARCUS: BoothConfig = {
  personaId: "logo-client-v1",
  clientName: "MARCUS WEBB",
  clientShortName: "MARCUS",
  idleBubble: "Your first client is waiting. Clock in when you're ready.",
  reviseBubble:
    "Fix what we talked about and send it again — or if you think we're done, wrap it up.",
  bubbles: {
    briefing:
      "So — Beanhound. We roast coffee, small batches, and our logo is embarrassing. Answer when you're ready.",
    scoping:
      "Send me the scope. Short. What you'll deliver and when — I have a roaster running.",
    working: "Send the file when it's done. I'll take a look.",
    revision: "Okay, I opened the file you sent. Let's talk.",
    delivered: "We're done here. Go read your debrief.",
  },
  brief: {
    client: "Marcus Webb",
    business: "Beanhound Coffee",
    job: "Logo design",
    budget: "Small",
    deadline: "Fast",
  },
  portrait: { skin: "#7c8a6e", hair: "#3a3028", sweater: "#6e2b2b" },
  nextRound: { href: "/practice2", label: "TRY A HARDER CLIENT →" },
};

export default function Practice() {
  return <PracticeBooth config={MARCUS} />;
}
