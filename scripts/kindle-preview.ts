#!/usr/bin/env npx tsx
/**
 * Kindle Preview Script
 *
 * Opens EPUB in Kindle Previewer 3, takes screenshots of how it renders
 * on different Kindle devices, and analyzes with Gemini vision API.
 *
 * Prerequisites:
 *   - Kindle Previewer 3 installed (brew install --cask kindle-previewer)
 *   - GEMINI_API_KEY environment variable set
 *
 * Usage:
 *   GEMINI_API_KEY=key npx tsx scripts/kindle-preview.ts
 *   GEMINI_API_KEY=key npx tsx scripts/kindle-preview.ts --device "Kindle Paperwhite"
 *   npx tsx scripts/kindle-preview.ts --screenshots-only
 *
 * Options:
 *   --epub PATH       Path to EPUB file (default: output/the-meta-engineer.epub)
 *   --device NAME     Kindle device to preview (default: all devices)
 *   --screenshots-only  Take screenshots but skip Gemini analysis
 *   --pages N         Number of pages to capture per device (default: 10)
 */

import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

// Default paths
const DEFAULT_EPUB = path.join(
  PROJECT_ROOT,
  "output",
  "the-meta-engineer.epub"
);
const OUTPUT_DIR = path.join(PROJECT_ROOT, ".kindle-review");
const SCREENSHOTS_DIR = path.join(OUTPUT_DIR, "screenshots");
const REPORT_PATH = path.join(PROJECT_ROOT, ".kindle-review-report.md");

// Supported Kindle devices in Kindle Previewer 3
const KINDLE_DEVICES = [
  "Kindle Paperwhite 5",
  "Kindle Oasis 3",
  "Kindle (2022)",
  "Kindle Fire HD 10",
  "Kindle iOS",
];

// Parse CLI args
const args = process.argv.slice(2);
const screenshotsOnly = args.includes("--screenshots-only");

function getArgValue(flag: string): string | null {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return null;
  return args[idx + 1] ?? null;
}

const epubPath: string = getArgValue("--epub") ?? DEFAULT_EPUB;
const targetDevice: string | null = getArgValue("--device");
const pagesArg = getArgValue("--pages");
const maxPages: number = pagesArg ? parseInt(pagesArg, 10) : 10;

async function main() {
  console.log("Kindle Preview Tool\n");

  // Validate prerequisites
  if (!checkKindleInstalled()) {
    console.error("Error: Kindle Previewer 3 not installed.");
    console.error("");
    console.error("Install with:");
    console.error("  brew install --cask kindle-previewer");
    console.error("");
    console.error("Or download from:");
    console.error(
      "  https://www.amazon.com/Kindle-Previewer/b?ie=UTF8&node=21381691011"
    );
    process.exit(1);
  }

  if (!screenshotsOnly && !process.env.GEMINI_API_KEY) {
    console.error("Error: GEMINI_API_KEY environment variable required");
    console.error("Set it in .env or pass inline:");
    console.error(
      "  GEMINI_API_KEY=key npx tsx scripts/kindle-preview.ts"
    );
    process.exit(1);
  }

  if (!fs.existsSync(epubPath)) {
    console.error(`Error: EPUB not found at ${epubPath}`);
    console.error("Build the EPUB first with:");
    console.error("  ./scripts/build-asciidoc.sh --epub");
    process.exit(1);
  }

  // Setup output directories
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true });
  }
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  console.log(`EPUB: ${epubPath}`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log(`Pages per device: ${maxPages}\n`);

  // Select devices to preview
  const devices = targetDevice
    ? [targetDevice]
    : KINDLE_DEVICES;

  console.log(`Devices: ${devices.join(", ")}\n`);

  const allScreenshots: { device: string; file: string; path: string }[] = [];

  for (const device of devices) {
    console.log(`\n--- ${device} ---`);

    try {
      const screenshots = await captureDeviceScreenshots(
        epubPath,
        device,
        maxPages
      );
      allScreenshots.push(...screenshots);
      console.log(`  Captured ${screenshots.length} screenshots`);
    } catch (err: any) {
      console.error(`  Error: ${err.message}`);
    }
  }

  console.log(`\nTotal screenshots: ${allScreenshots.length}`);

  if (screenshotsOnly || allScreenshots.length === 0) {
    console.log(`\nScreenshots saved to: ${SCREENSHOTS_DIR}`);
    if (screenshotsOnly) {
      console.log("Skipping Gemini review (--screenshots-only mode).");
    }
    return;
  }

  // Analyze with Gemini
  console.log("\nSending to Gemini for analysis...\n");
  const reviews = await analyzeWithGemini(allScreenshots);

  // Generate report
  const report = generateReport(reviews);
  fs.writeFileSync(REPORT_PATH, report);
  console.log(`\nReport saved to: ${REPORT_PATH}`);
}

function checkKindleInstalled(): boolean {
  return fs.existsSync(
    "/Applications/Kindle Previewer 3.app"
  );
}

async function captureDeviceScreenshots(
  epubPath: string,
  device: string,
  maxPages: number
): Promise<{ device: string; file: string; path: string }[]> {
  const deviceDir = path.join(
    SCREENSHOTS_DIR,
    device.replace(/\s+/g, "-")
  );
  fs.mkdirSync(deviceDir, { recursive: true });

  // Open Kindle Previewer with the EPUB
  console.log("  Opening Kindle Previewer...");

  const openScript = `
    tell application "Kindle Previewer 3"
      activate
      open POSIX file "${epubPath}"
    end tell
    delay 5
  `;

  execSync(`osascript -e '${openScript}'`, { stdio: "pipe" });

  // Wait for EPUB to load
  await sleep(5000);

  // Take screenshots using macOS screencapture
  const screenshots: { device: string; file: string; path: string }[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const filename = `${device.replace(/\s+/g, "-")}-page-${String(page).padStart(3, "0")}.png`;
    const screenshotPath = path.join(deviceDir, filename);

    // Capture the Kindle Previewer window
    try {
      execSync(
        `screencapture -l $(osascript -e 'tell app "Kindle Previewer 3" ` +
          `to id of window 1') "${screenshotPath}"`,
        { stdio: "pipe" }
      );

      if (fs.existsSync(screenshotPath)) {
        screenshots.push({
          device,
          file: filename,
          path: screenshotPath,
        });
        console.log(`  Page ${page} captured`);
      }

      // Navigate to next page using arrow key
      execSync(
        `osascript -e 'tell app "System Events" to key code 124'`,
        { stdio: "pipe" }
      );
      await sleep(500);
    } catch (err: any) {
      console.error(`  Failed to capture page ${page}: ${err.message}`);
      break;
    }
  }

  // Close Kindle Previewer
  execSync(
    `osascript -e 'tell app "Kindle Previewer 3" to quit'`,
    { stdio: "pipe" }
  );

  return screenshots;
}

async function analyzeWithGemini(
  screenshots: { device: string; file: string; path: string }[]
): Promise<{ device: string; file: string; review: string }[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  const reviewPrompt = `You are reviewing screenshots of a Kindle book preview.
This is a technical book about AI engineering with Claude Code.

Analyze the Kindle rendering quality. Focus on:

1. **Code blocks**: Are they readable on this Kindle device? Is syntax clear?
   Is the font size appropriate? Any overflow or wrapping issues?
2. **Typography**: Is the font readable on e-ink? Are headings distinct?
3. **Tables**: Are they rendered correctly? Readable on small screens?
4. **Images/Diagrams**: Are they clear and appropriately sized?
5. **Page breaks**: Are chapters and sections well-separated?
6. **Navigation**: Does the TOC appear functional?
7. **Overall e-reader experience**: Would this be comfortable to read?

For each issue found, report:
- The specific problem
- Location (page area, element type)
- Severity (critical/high/medium/low)
- Suggested fix

Be specific and actionable. If a page looks good, say so briefly.`;

  const reviews: { device: string; file: string; review: string }[] = [];

  // Process in batches to avoid rate limits
  const batchSize = 3;
  for (let i = 0; i < screenshots.length; i += batchSize) {
    const batch = screenshots.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(async ({ device, file, path: imgPath }) => {
        const imageData = fs.readFileSync(imgPath, { encoding: "base64" });

        try {
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
              {
                inlineData: {
                  mimeType: "image/png",
                  data: imageData,
                },
              },
              {
                text: `${reviewPrompt}\n\nDevice: ${device}\nFile: ${file}`,
              },
            ],
          });

          const review = response.text ?? "(no response)";
          console.log(`  ✓ ${device} - ${file}`);
          return { device, file, review };
        } catch (err: any) {
          const msg = err.message || String(err);
          console.error(`  ✗ ${device} - ${file}: ${msg}`);
          return { device, file, review: `ERROR: ${msg}` };
        }
      })
    );

    reviews.push(...batchResults);

    if (i + batchSize < screenshots.length) {
      await sleep(1000);
    }
  }

  return reviews;
}

function generateReport(
  reviews: { device: string; file: string; review: string }[]
): string {
  const timestamp = new Date().toISOString().split("T")[0];
  let md = `# Kindle Preview Report\n\n`;
  md += `**Date**: ${timestamp}\n`;
  md += `**Model**: gemini-2.5-flash\n`;
  md += `**Pages reviewed**: ${reviews.length}\n\n`;
  md += `---\n\n`;

  // Group by device
  const byDevice = new Map<
    string,
    { file: string; review: string }[]
  >();
  for (const r of reviews) {
    const list = byDevice.get(r.device) || [];
    list.push({ file: r.file, review: r.review });
    byDevice.set(r.device, list);
  }

  for (const [device, pages] of byDevice) {
    md += `## ${device}\n\n`;

    for (const { file, review } of pages) {
      md += `### ${file}\n\n`;
      md += `${review}\n\n`;
    }

    md += `---\n\n`;
  }

  // Summary section
  md += `## Summary\n\n`;
  md += `### Devices Reviewed\n\n`;
  for (const [device, pages] of byDevice) {
    md += `- **${device}**: ${pages.length} pages\n`;
  }

  md += `\n### Next Steps\n\n`;
  md += `1. Review critical issues first\n`;
  md += `2. Test fixes in Kindle Previewer\n`;
  md += `3. Re-run this script to verify\n`;
  md += `4. Consider device-specific CSS adjustments\n`;

  return md;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
