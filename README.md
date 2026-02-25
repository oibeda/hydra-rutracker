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

# Через прокси (http, https, socks5)
npx tsx src/index.ts --login user --password pass --proxy socks5://127.0.0.1:1080
```

Логин и пароль можно задать через `.env`. Прокси также можно задать через переменную окружения:

```
RUTRACKER_LOGIN=user
RUTRACKER_PASSWORD=pass
HTTPS_PROXY=socks5://127.0.0.1:1080
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

Дополнительные разделы можно добавить в `src/config.ts` (массив `DEFAULT_SECTIONS`).

| ID | Название |
|----|----------|
| 635 | Горячие Новинки |
| 127 | Аркады |
| 2203 | Файтинги |
| 647 | Экшены от 1 лица |
| 646 | Экшены от 3 лица |
| 50 | Хорроры |
| 53 | Приключения и квесты |
| 900 | Визуальные новеллы |
| 52 | Ролевые игры |
| 54 | Симуляторы |
| 51 | Стратегии real-time |
| 2226 | Стратегии пошаговые |