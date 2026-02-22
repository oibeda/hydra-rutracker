import { ForumSection } from "./types";

export const BASE_URL = "https://rutracker.org/forum";

export const REQUEST_DELAY_MS = 1500;

export const MAX_RETRIES = 3;

export const DEFAULT_SECTIONS: ForumSection[] = [
  { id: 5, name: "Игры для Windows" },
  { id: 635, name: "Горячие Новинки" },
  { id: 127, name: "Аркады" },
  { id: 2203, name: "Файтинги" },
  { id: 647, name: "Экшены от 1 лица" },
  { id: 646, name: "Экшены от 3 лица" },
  { id: 50, name: "Хорроры" },
  { id: 53, name: "Приключения и квесты" },
  { id: 900, name: "Визуальные новеллы" },
  { id: 52, name: "Ролевые игры" },
  { id: 54, name: "Симуляторы" },
  { id: 51, name: "Стратегии real-time" },
  { id: 2226, name: "Стратегии пошаговые" },
];
