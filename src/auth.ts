import axios from "axios";
import * as cheerio from "cheerio";
import * as readline from "readline";
import { ProxyAgent } from "proxy-agent";
import { decode } from "windows-1251";
import { BASE_URL } from "./config";
import { log } from "./utils";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export async function login(
  username: string,
  password: string,
  proxyUrl?: string
): Promise<string> {
  log("Авторизация на rutracker.org...");

  const agentOpts: Record<string, any> = {};
  if (proxyUrl) {
    const agent = new ProxyAgent({ getProxyForUrl: () => proxyUrl });
    agentOpts.httpAgent = agent;
    agentOpts.httpsAgent = agent;
    log(`Используется прокси: ${proxyUrl}`);
  }

  const commonHeaders = {
    "User-Agent": UA,
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

  // Step 1: GET login page to check for CAPTCHA
  const getResp = await axios.get(`${BASE_URL}/login.php`, {
    headers: commonHeaders,
    responseType: "arraybuffer",
    validateStatus: () => true,
    ...agentOpts,
  });

  const loginHtml = decode(Buffer.from(getResp.data));
  const $ = cheerio.load(loginHtml);

  // Extract CAPTCHA fields if present
  const capSid = $("input[name='cap_sid']").val() as string | undefined;
  const captchaImg = $("img[src*='captcha']").attr("src");
  const capCodeInput = $("input[name^='cap_code']");
  const capCodeFieldName = capCodeInput.attr("name");

  // Build POST body
  let body = `login_username=${encodeURIComponent(username)}&login_password=${encodeURIComponent(password)}&login=%C2%F5%EE%E4`;

  if (capSid && capCodeFieldName) {
    log(`CAPTCHA обнаружена!`);
    if (captchaImg) {
      console.log(`\n  Откройте CAPTCHA в браузере:\n  ${captchaImg}\n`);
    }
    const code = await prompt("  Введите код CAPTCHA: ");
    body += `&cap_sid=${encodeURIComponent(capSid)}&${encodeURIComponent(capCodeFieldName)}=${encodeURIComponent(code)}`;
  }

  // Step 2: POST login
  const response = await axios.post(`${BASE_URL}/login.php`, body, {
    headers: {
      ...commonHeaders,
      "Content-Type": "application/x-www-form-urlencoded",
      "Referer": `${BASE_URL}/login.php`,
      "Origin": BASE_URL,
    },
    maxRedirects: 0,
    validateStatus: () => true,
    ...agentOpts,
  });

  const setCookies = response.headers["set-cookie"];
  if (!setCookies || setCookies.length === 0) {
    throw new Error(
      `Не удалось авторизоваться (HTTP ${response.status}): сервер не вернул cookie.`
    );
  }

  const allCookies = setCookies.map((c: string) => c.split(";")[0]);
  const bbSession = allCookies.find((c: string) =>
    c.startsWith("bb_session=")
  );

  if (!bbSession) {
    throw new Error(
      `Не удалось найти bb_session. Полученные cookie: ${allCookies.join("; ")}`
    );
  }

  const sessionValue = bbSession.split("=")[1];
  if (!sessionValue || sessionValue === "deleted") {
    throw new Error(
      "bb_session пустой или удалён — неверный логин/пароль или неправильный код CAPTCHA."
    );
  }

  log("Авторизация успешна.");
  return bbSession;
}
