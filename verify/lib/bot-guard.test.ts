import { describe, it, expect } from "vitest";
import { classifyUserAgent, isProbePath } from "@/lib/bot-guard";

const CHROME_MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const SAFARI_IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1";
const FIREFOX_WIN = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:143.0) Gecko/20100101 Firefox/143.0";
const CUBOT_ANDROID =
  "Mozilla/5.0 (Linux; Android 10; CUBOT X30) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

describe("classifyUserAgent", () => {
  it("lets real browsers through", () => {
    for (const ua of [CHROME_MAC, SAFARI_IOS, FIREFOX_WIN, CUBOT_ANDROID]) expect(classifyUserAgent(ua)).toBe("ok");
  });

  it("lets link-preview fetchers and Vercel's own agents through", () => {
    for (const ua of [
      "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
      "Twitterbot/1.0",
      "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
      "vercel-cron/1.0",
      "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)",
    ]) expect(classifyUserAgent(ua)).toBe("ok");
  });

  it("blocks AI crawlers, search spiders and anything with a crawler contact URL", () => {
    for (const ua of [
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)",
      "CCBot/2.0 (https://commoncrawl.org/faq/)",
      "Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
      "Mozilla/5.0 (compatible; Bytespider; spider-feedback@bytedance.com)",
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)",
      "Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)",
    ]) expect(classifyUserAgent(ua)).toBe("blocked");
  });

  it("blocks scanners, HTTP libraries, headless browsers and a missing UA", () => {
    for (const ua of [
      "sqlmap/1.8#stable (https://sqlmap.org)",
      "Mozilla/5.0 (compatible; Nuclei - Open-source project (github.com/projectdiscovery/nuclei))",
      "Mozilla/5.00 (Nikto/2.5.0)",
      "curl/8.7.1",
      "python-requests/2.32.3",
      "Go-http-client/2.0",
      "node",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.0.0 Safari/537.36",
      "",
      undefined,
    ]) expect(classifyUserAgent(ua)).toBe("blocked");
  });
});

describe("isProbePath", () => {
  it("flags what scanners ask for", () => {
    for (const p of ["/.env", "/.git/config", "/wp-login.php", "/wp-admin/", "/phpmyadmin", "/administrator", "/administrator/index.php", "/admin.php", "/backup.zip", "/index.php", "/api/v1/x.bak", "/server-status", "/vendor/phpunit/src/Util/PHP/eval-stdin.php", "/a/../etc/passwd", "/%2E%2E/x"]) {
      expect(isProbePath(p), p).toBe(true);
    }
  });

  it("leaves every real route and asset alone", () => {
    for (const p of ["/", "/beta", "/preview", "/open-markets", "/open-markets/create", "/profile", "/mpp2.23", "/api/v1/beta/signin", "/api/concierge/chat", "/brand/madhatr-bust.png", "/cards/manifest.json", "/pitch/index.html", "/robots.txt", "/administration-guide-is-not-a-route-but-fine", "/admin", "/admin/sign-in", "/admin/admins", "/admin/support", "/api/admin/me"]) {
      expect(isProbePath(p), p).toBe(false);
    }
  });
});
