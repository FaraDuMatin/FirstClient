// Deterministic color pass. The "no blue" trap must never depend on an LLM
// deciding whether navy counts as blue — this is computed from pixels.

import sharp from "sharp";
import type { ColorStats } from "@/lib/types";

// Hue window (degrees) treated as "blue", with saturation/value floors so
// near-gray and near-black pixels don't count.
const BLUE_HUE_MIN = 190;
const BLUE_HUE_MAX = 265;
const MIN_SATURATION = 0.2;
const MIN_VALUE = 0.15;

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = 60 * (((gn - bn) / d) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / d + 2);
    else h = 60 * ((rn - gn) / d + 4);
  }
  if (h < 0) h += 360;
  const s = max === 0 ? 0 : d / max;
  return [h, s, max];
}

export async function computeColorStats(image: Buffer): Promise<ColorStats> {
  const { data, info } = await sharp(image)
    .resize(64, 64, { fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const bins = new Map<string, number>();
  let opaquePixels = 0;
  let bluePixels = 0;

  for (let i = 0; i < info.width * info.height; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const a = data[i * 4 + 3];
    if (a < 128) continue;
    opaquePixels++;

    const [h, s, v] = rgbToHsv(r, g, b);
    if (h >= BLUE_HUE_MIN && h <= BLUE_HUE_MAX && s >= MIN_SATURATION && v >= MIN_VALUE) {
      bluePixels++;
    }

    // Quantize to 8 levels per channel (512 bins) for dominant-color counting.
    const key = `${r >> 5},${g >> 5},${b >> 5}`;
    bins.set(key, (bins.get(key) ?? 0) + 1);
  }

  const total = Math.max(opaquePixels, 1);
  const dominantColors = [...bins.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key, count]) => {
      const [rq, gq, bq] = key.split(",").map(Number);
      // Bin center back to 0-255.
      const hex = [rq, gq, bq]
        .map((q) => (q * 32 + 16).toString(16).padStart(2, "0"))
        .join("");
      return { hex: `#${hex}`, share: count / total };
    });

  return { dominantColors, blueShare: bluePixels / total };
}
