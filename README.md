# hydra-rutracker

JSON-парсер раздач с rutracker.org для [Hydra Launcher](https://github.com/hydralauncher/hydra).

Парсит подразделы рубрики "Игры для Windows", генерирует JSON-файлы с метаданными торрентов (название, magnet-ссылки, дата загрузки, размер файла).

## Установка

```bash
npm install
```

## Использование

```bash
# Все настроенные разделы
npx tsx src/index.ts --login user --password pass --sections all

# Конкретные разделы по ID
npx tsx src/index.ts --login user --password pass --sections 2203,960

# С указанием папки вывода
npx tsx src/index.ts --login user --password pass --sections all --output ./data
```

Логин и пароль можно задать через `.env`:

```
RUTRACKER_LOGIN=user
RUTRACKER_PASSWORD=pass
```

При авторизации может потребоваться ввод CAPTCHA — ссылка на картинку будет выведена в консоль.

## Выходной формат

Каждый раздел сохраняется в отдельный JSON. После завершения все файлы сливаются в `main.json`:

```json
{
  "name": "Rutracker | All Categories",
  "downloads": [
    {
      "title": "God of War: Ragnarök ...",
      "uris": ["magnet:?xt=urn:btih:..."],
      "uploadDate": "2024-09-20T08:06:00Z",
      "fileSize": "175.77 GB",
      "repackLinkSource": "https://rutracker.org/forum/viewtopic.php?t=6575303"
    }
  ]
}
```

## Разделы по умолчанию

| ID | Название |
|----|----------|
| 5 | Игры для Windows |
| 635 | Горячие Новинки |
| 2203 | Repack |
| 960 | От Механиков |
| 2228 | Аркады |
| 647 | Экшены / Шутеры |
| 646 | RPG / Ролевые |
| 50 | Стратегии |
| 53 | Симуляторы |
| 1008 | Приключения и квесты |
