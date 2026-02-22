import { ForumSection } from "./types";

export const BASE_URL = "https://rutracker.org/forum";

export const REQUEST_DELAY_MS = 1500;

export const MAX_RETRIES = 3;

export const DEFAULT_SECTIONS: ForumSection[] = [
  { id: 5, name: "Игры для Windows" },
  { id: 635, name: "Горячие Новинки" },
  { id: 2203, name: "Игры для Windows (Repack)" },
  { id: 960, name: "Игры для Windows от Механиков" },
  { id: 2228, name: "Аркады" },
  { id: 647, name: "Экшены / Шутеры" },
  { id: 646, name: "RPG / Ролевые" },
  { id: 50, name: "Стратегии" },
  { id: 53, name: "Симуляторы" },
  { id: 1008, name: "Приключения и квесты" },
];
