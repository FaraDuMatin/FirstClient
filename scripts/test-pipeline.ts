// Proves the demo-critical pipeline with synthetic logos generated in code:
// pixels -> computeColorStats -> Gemini vision -> buildRevisionPrompt.
// Run: npm run test:pipeline

import sharp from "sharp";
import { computeColorStats } from "../lib/submission/colors";
import { analyzeSubmission } from "../lib/submission/analyze";
import { buildRevisionPrompt } from "../lib/agent/prompt";
import { getPersona, DEFAULT_PERSONA_ID } from "../lib/personas";
import type { Submission } from "../lib/types";

try {
  process.loadEnvFile(".env.local");
} catch {
  // fall through to process env
}

type TestLogo = {
  name: string;
  expectBlueViolation: boolean;
  make: () => Promise<Buffer>;
};

function svgLogo(bg: string, fg: string, text: string): Buffer {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240">
      <rect width="400" height="240" fill="${bg}"/>
      <circle cx="200" cy="90" r="50" fill="${fg}"/>
      <text x="200" y="200" font-family="Arial" font-size="42" font-weight="bold"
            fill="${fg}" text-anchor="middle">${text}</text>
    </svg>`,
  );
}

const LOGOS: TestLogo[] = [
  {
    name: "solid blue",
    expectBlueViolation: true,
    make: () =>
      sharp({ create: { width: 200, height: 200, channels: 3, background: "#2563eb" } })
        .png()
        .toBuffer(),
  },
  {
    name: "navy wordmark (Beanhound)",
    expectBlueViolation: true,
    make: () => sharp(svgLogo("#f5f0e6", "#1e3a8a", "Beanhound")).png().toBuffer(),
  },
  {
    name: "teal edge case",
    expectBlueViolation: false, // teal hue ~180 sits below our 190-265 blue window
    make: () => sharp(svgLogo("#ffffff", "#0d9488", "Beanhound")).png().toBuffer(),
  },
  {
    name: "warm red (Beanhound)",
    expectBlueViolation: false,
    make: () => sharp(svgLogo("#f5f0e6", "#8a3324", "Beanhound")).png().toBuffer(),
  },
  {
    name: "black wordmark, WRONG name (Beanhouse)",
    expectBlueViolation: false,
    make: () => sharp(svgLogo("#ffffff", "#1c1917", "Beanhouse")).png().toBuffer(),
  },
];

async function main() {
  const persona = getPersona(DEFAULT_PERSONA_ID);
  let failures = 0;

  for (const logo of LOGOS) {
    console.log(`\n=== ${logo.name} ===`);
    const png = await logo.make();

    // 1) deterministic color pass
    const colorStats = await computeColorStats(png);
    console.log(
      `  blueShare=${colorStats.blueShare.toFixed(3)}  dominant=${colorStats.dominantColors
        .slice(0, 3)
        .map((c) => `${c.hex}(${(c.share * 100).toFixed(0)}%)`)
        .join(" ")}`,
    );

    const detBlue = colorStats.blueShare > 0.05;
    if (detBlue !== logo.expectBlueViolation) {
      failures++;
      console.log(
        `  [FAIL] deterministic blue detection: got ${detBlue}, expected ${logo.expectBlueViolation}`,
      );
    } else {
      console.log(`  [OK]   deterministic blue detection = ${detBlue}`);
    }

    // 2) Gemini vision analysis
    try {
      const analysis = await analyzeSubmission(
        { type: "image", data: png.toString("base64"), mime_type: "image/png" },
        persona,
        colorStats,
      );
      console.log(`  vision: "${analysis.overallDescription.slice(0, 100)}..."`);
      console.log(`  colors: ${analysis.detectedColors.map((c) => c.name).join(", ")}`);
      console.log(`  text:   ${analysis.textInLogo.join(" | ") || "(none)"}`);
      for (const v of analysis.hiddenRequirementViolations) {
        console.log(`  req ${v.requirementId}: violated=${v.violated} — ${v.evidence.slice(0, 90)}`);
      }

      const geminiBlue = analysis.hiddenRequirementViolations.find(
        (v) => v.requirementId === "no-blue",
      );
      if (geminiBlue && geminiBlue.violated !== logo.expectBlueViolation) {
        failures++;
        console.log(
          `  [FAIL] Gemini no-blue judgment: got ${geminiBlue.violated}, expected ${logo.expectBlueViolation}`,
        );
      } else if (geminiBlue) {
        console.log(`  [OK]   Gemini no-blue judgment = ${geminiBlue.violated}`);
      } else {
        failures++;
        console.log(`  [FAIL] Gemini returned no judgment for requirement "no-blue"`);
      }

      // 3) revision prompt build (the string the voice agent will receive)
      const submission: Submission = {
        imageDataUrl: "(omitted)",
        mimeType: "image/png",
        submittedAt: new Date().toISOString(),
        colorStats,
        analysis,
      };
      const prompt = buildRevisionPrompt(persona, submission);
      console.log(`  [OK]   revision prompt built (${prompt.length} chars)`);
    } catch (e) {
      failures++;
      console.log(`  [FAIL] Gemini analysis: ${e instanceof Error ? e.message.slice(0, 300) : e}`);
    }
  }

  console.log(`\n${failures === 0 ? "ALL GREEN" : `${failures} FAILURE(S)`}`);
  process.exitCode = failures === 0 ? 0 : 1;
}

void main();
