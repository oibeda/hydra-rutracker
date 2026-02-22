import * as cheerio from "cheerio";
import { AxiosInstance } from "axios";
import { REQUEST_DELAY_MS } from "./config";
import { fetchPage, delay, log } from "./utils";

export interface TopicLink {
  id: number;
  title: string;
}

export async function parseForumSection(
  client: AxiosInstance,
  forumId: number,
  sectionName: string
): Promise<TopicLink[]> {
  const topics: TopicLink[] = [];

  const firstPageHtml = await fetchPage(
    client,
    `/viewforum.php?f=${forumId}`
  );
  const $ = cheerio.load(firstPageHtml);

  const totalPages = getTotalPages($);
  log(`[${sectionName}] Найдено страниц: ${totalPages}`);

  extractTopics($, topics);
  log(`[${sectionName}] Страница 1/${totalPages} — тем: ${topics.length}`);

  for (let page = 2; page <= totalPages; page++) {
    await delay(REQUEST_DELAY_MS);
    const start = (page - 1) * 50;
    const html = await fetchPage(
      client,
      `/viewforum.php?f=${forumId}&start=${start}`
    );
    const $page = cheerio.load(html);
    const before = topics.length;
    extractTopics($page, topics);
    log(
      `[${sectionName}] Страница ${page}/${totalPages} — новых тем: ${topics.length - before}`
    );
  }

  log(`[${sectionName}] Всего тем найдено: ${topics.length}`);
  return topics;
}

function getTotalPages($: cheerio.CheerioAPI): number {
  const pageLinks = $("a.pg").toArray();
  if (pageLinks.length === 0) return 1;

  let maxPage = 1;
  for (const link of pageLinks) {
    const text = $(link).text().trim();
    const num = parseInt(text, 10);
    if (!isNaN(num) && num > maxPage) {
      maxPage = num;
    }
  }
  return maxPage;
}

function extractTopics(
  $: cheerio.CheerioAPI,
  topics: TopicLink[]
): void {
  $("a.torTopic, a.topictitle, a[id^='tt-']").each((_, el) => {
    const href = $(el).attr("href") || "";
    const match = href.match(/viewtopic\.php\?t=(\d+)/);
    if (match) {
      const id = parseInt(match[1], 10);
      const title = $(el).text().trim();
      if (title && !topics.some((t) => t.id === id)) {
        topics.push({ id, title });
      }
    }
  });
}
