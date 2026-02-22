import "dotenv/config";
import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import { login } from "./auth";
import { parseForumSection } from "./forum";
import { parseTopic } from "./topic";
import { mergeOutputFiles } from "./merge";
import { DEFAULT_SECTIONS, REQUEST_DELAY_MS } from "./config";
import { createHttpClient, delay, log } from "./utils";
import { ForumSection, SectionOutput } from "./types";

const program = new Command();

program
  .name("hydra-rutracker")
  .description("Парсер раздела 'Игры для Windows' rutracker.org")
  .option("--login <login>", "Логин rutracker.org", process.env.RUTRACKER_LOGIN)
  .option("--password <password>", "Пароль rutracker.org", process.env.RUTRACKER_PASSWORD)
  .option(
    "--sections <ids>",
    'ID разделов через запятую или "all"',
    "all"
  )
  .option("--output <dir>", "Папка вывода", "./output")
  .parse();

const opts = program.opts();

async function main() {
  if (!opts.login || !opts.password) {
    console.error("Ошибка: укажите --login и --password или задайте RUTRACKER_LOGIN/RUTRACKER_PASSWORD в .env");
    process.exit(1);
  }

  const outputDir = path.resolve(opts.output);
  fs.mkdirSync(outputDir, { recursive: true });

  const cookie = await login(opts.login, opts.password);
  const client = createHttpClient(cookie);

  const sections = resolveSections(opts.sections);
  log(`Разделов для парсинга: ${sections.length}`);

  let savedData: Map<string, SectionOutput> = new Map();

  const shutdown = () => {
    log("\nПрерывание! Сохранение собранных данных...");
    for (const [fileName, data] of savedData) {
      const filePath = path.join(outputDir, fileName);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    }
    if (savedData.size > 0) {
      mergeOutputFiles(outputDir);
    }
    process.exit(0);
  };
  process.on("SIGINT", shutdown);

  for (const section of sections) {
    log(`\n=== Раздел: ${section.name} (f=${section.id}) ===`);

    const topics = await parseForumSection(
      client,
      section.id,
      section.name
    );

    const downloads = [];
    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      log(
        `  [${i + 1}/${topics.length}] Парсинг: ${topic.title.substring(0, 60)}...`
      );

      await delay(REQUEST_DELAY_MS);
      try {
        const dl = await parseTopic(client, topic.id, topic.title);
        if (dl) {
          downloads.push(dl);
        }
      } catch (err: any) {
        console.warn(
          `  [!] Ошибка парсинга темы ${topic.id}: ${err.message}`
        );
      }
    }

    const sectionOutput: SectionOutput = {
      name: `Rutracker | ${section.name}`,
      downloads,
    };

    const safeName = section.name
      .replace(/[^a-zA-Zа-яА-Я0-9]/g, "_")
      .substring(0, 50);
    const fileName = `${section.id}_${safeName}.json`;
    const filePath = path.join(outputDir, fileName);
    fs.writeFileSync(
      filePath,
      JSON.stringify(sectionOutput, null, 2),
      "utf-8"
    );
    savedData.set(fileName, sectionOutput);

    log(
      `[${section.name}] Сохранено ${downloads.length} раздач → ${fileName}`
    );
  }

  mergeOutputFiles(outputDir);
  log("\nГотово!");
}

function resolveSections(input: string): ForumSection[] {
  if (input === "all") {
    return DEFAULT_SECTIONS;
  }
  const ids = input.split(",").map((s) => parseInt(s.trim(), 10));
  return ids.map((id) => {
    const known = DEFAULT_SECTIONS.find((s) => s.id === id);
    return known || { id, name: `Forum_${id}` };
  });
}

main().catch((err) => {
  console.error("Критическая ошибка:", err.message);
  process.exit(1);
});
