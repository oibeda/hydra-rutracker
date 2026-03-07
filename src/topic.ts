import * as cheerio from "cheerio";
import { AxiosInstance } from "axios";
import { Download } from "./types";
import { fetchPage, log } from "./utils";

export async function parseTopic(
  client: AxiosInstance,
  topicId: number,
  topicTitle: string
): Promise<Download | null> {
  const html = await fetchPage(client, `/viewtopic.php?t=${topicId}`);
  const $ = cheerio.load(html);

  const rawMagnet = $("a.magnet-link").attr("href") || "";
  if (!rawMagnet || !rawMagnet.startsWith("magnet:?")) {
    console.warn(`  [!] Тема ${topicId}: magnet-ссылка не найдена, пропуск.`);
    return null;
  }

  const magnetLink = normalizeTrackers(rawMagnet);
  const fileSize = extractFileSize($);
  const uploadDate = extractUploadDate($);

  return {
    title: topicTitle,
    uris: [magnetLink],
    uploadDate,
    fileSize,
    repackLinkSource: `https://rutracker.org/forum/viewtopic.php?t=${topicId}`,
  };
}

const RUTRACKER_TRACKERS = [
  "http%3A%2F%2Fbt.t-ru.org%2Fann%3Fmagnet",
  "http%3A%2F%2Fbt2.t-ru.org%2Fann%3Fmagnet",
  "http%3A%2F%2Fbt3.t-ru.org%2Fann%3Fmagnet",
  "http%3A%2F%2Fbt4.t-ru.org%2Fann%3Fmagnet",
];

function normalizeTrackers(magnet: string): string {
  const hashMatch = magnet.match(/btih:([A-Fa-f0-9]+)/i);
  if (!hashMatch) return magnet;
  const hash = hashMatch[1].toUpperCase();
  return `magnet:?xt=urn:btih:${hash}${RUTRACKER_TRACKERS.map((t) => `&tr=${t}`).join("")}`;
}

function extractFileSize($: cheerio.CheerioAPI): string {
  const sizeEl = $(".attach_link.guest a").first();
  if (sizeEl.length) {
    const parentText = sizeEl.parent().text();
    const sizeMatch = parentText.match(
      /(\d+[\.,]?\d*)\s*(GB|MB|KB|TB|ГБ|МБ|КБ|ТБ)/i
    );
    if (sizeMatch) {
      return `${sizeMatch[1].replace(",", ".")} ${normalizeSizeUnit(sizeMatch[2])}`;
    }
  }

  const bodyText = $("#topic_main .post_body").first().text();
  const fallbackMatch = bodyText.match(
    /(\d+[\.,]?\d*)\s*(GB|MB|KB|TB|ГБ|МБ|КБ|ТБ)/i
  );
  if (fallbackMatch) {
    return `${fallbackMatch[1].replace(",", ".")} ${normalizeSizeUnit(fallbackMatch[2])}`;
  }

  return "0 MB";
}

function normalizeSizeUnit(unit: string): string {
  const map: Record<string, string> = {
    ГБ: "GB",
    МБ: "MB",
    КБ: "KB",
    ТБ: "TB",
    GB: "GB",
    MB: "MB",
    KB: "KB",
    TB: "TB",
  };
  return map[unit.toUpperCase()] || unit;
}

function extractUploadDate($: cheerio.CheerioAPI): string {
  const dateEl = $(".post_head .p-link a").first();
  if (dateEl.length) {
    const dateText = dateEl.text().trim();
    const parsed = parseRuDate(dateText);
    if (parsed) return parsed;
  }

  const regDateEl = $(".post_head .post-time").first();
  if (regDateEl.length) {
    const parsed = parseRuDate(regDateEl.text().trim());
    if (parsed) return parsed;
  }

  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function parseRuDate(text: string): string | null {
  const months: Record<string, number> = {
    "Янв": 0, "Фев": 1, "Мар": 2, "Апр": 3,
    "Май": 4, "Июн": 5, "Июл": 6, "Авг": 7,
    "Сен": 8, "Окт": 9, "Ноя": 10, "Дек": 11,
  };

  const match = text.match(
    /(\d{1,2})-(\w{3})-(\d{2,4})\s+(\d{1,2}):(\d{2})/
  );
  if (match) {
    const day = parseInt(match[1], 10);
    const month = months[match[2]];
    let year = parseInt(match[3], 10);
    if (year < 100) year += 2000;
    const hours = parseInt(match[4], 10);
    const minutes = parseInt(match[5], 10);

    if (month !== undefined) {
      const date = new Date(Date.UTC(year, month, day, hours, minutes, 0));
      return date.toISOString().replace(/\.\d{3}Z$/, "Z");
    }
  }

  return null;
}
