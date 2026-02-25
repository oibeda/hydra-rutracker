import axios, { AxiosInstance } from "axios";
import { ProxyAgent } from "proxy-agent";
import { decode } from "windows-1251";
import { BASE_URL, MAX_RETRIES } from "./config";

export function decodeCp1251(buffer: Buffer): string {
  return decode(buffer);
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createHttpClient(cookie?: string, proxyUrl?: string): AxiosInstance {
  const headers: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-User": "?1",
  };
  if (cookie) {
    headers["Cookie"] = cookie;
  }
  const config: Record<string, any> = {
    baseURL: BASE_URL,
    responseType: "arraybuffer",
    headers,
    maxRedirects: 5,
    timeout: 30000,
  };
  if (proxyUrl) {
    const agent = new ProxyAgent({ getProxyForUrl: () => proxyUrl });
    config.httpAgent = agent;
    config.httpsAgent = agent;
  }
  return axios.create(config);
}

export async function fetchPage(
  client: AxiosInstance,
  url: string
): Promise<string> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.get(url);
      return decodeCp1251(Buffer.from(response.data));
    } catch (err: any) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        const backoff = Math.pow(2, attempt) * 1000;
        console.warn(
          `  [retry ${attempt}/${MAX_RETRIES}] ${url} — ожидание ${backoff}мс...`
        );
        await delay(backoff);
      }
    }
  }
  throw lastError;
}

export function log(message: string): void {
  const time = new Date().toLocaleTimeString("ru-RU");
  console.log(`[${time}] ${message}`);
}
