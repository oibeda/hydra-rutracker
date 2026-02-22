import * as fs from "fs";
import * as path from "path";
import { SectionOutput } from "./types";
import { log } from "./utils";

export function mergeOutputFiles(outputDir: string): void {
  const files = fs
    .readdirSync(outputDir)
    .filter((f) => f.endsWith(".json") && f !== "main.json");

  if (files.length === 0) {
    log("Нет файлов для слияния.");
    return;
  }

  const allDownloads = new Map<string, any>();

  for (const file of files) {
    const filePath = path.join(outputDir, file);
    const data: SectionOutput = JSON.parse(
      fs.readFileSync(filePath, "utf-8")
    );
    for (const dl of data.downloads) {
      const magnetHash = extractMagnetHash(dl.uris[0]);
      if (magnetHash && !allDownloads.has(magnetHash)) {
        allDownloads.set(magnetHash, dl);
      }
    }
  }

  const merged: SectionOutput = {
    name: "Rutracker | All Categories",
    downloads: Array.from(allDownloads.values()),
  };

  const outputPath = path.join(outputDir, "main.json");
  fs.writeFileSync(outputPath, JSON.stringify(merged, null, 2), "utf-8");
  log(
    `Слияние завершено: ${merged.downloads.length} уникальных раздач → ${outputPath}`
  );
}

function extractMagnetHash(magnet: string): string | null {
  const match = magnet.match(/btih:([A-Fa-f0-9]+)/);
  return match ? match[1].toUpperCase() : null;
}
