/**
 * MAD Gambit — bot, scanner and scraper guard (pure; used by proxy.ts).
 *
 * What this does, and what no website can do
 * -------------------------------------------
 * It raises the cost of automated access. It turns away crawlers that identify
 * themselves (AI trainers, SEO spiders), off-the-shelf vulnerability scanners,
 * and bare HTTP libraries (curl, python-requests, Go, headless Chrome) that
 * arrive WITHOUT a guest pass. It answers the paths scanners probe for (.env,
 * .git, wp-login.php …) with a flat 404, so the gate itself is not a "this
 * site exists, log in here" signal.
 *
 * A determined scraper can spoof a browser User-Agent; that is why this is one
 * layer of several (guest gate, rate limits, Vercel Firewall bot rules) rather
 * than the whole defence. Signed-in guests are never blocked by User-Agent, so
 * the team's own scripts with Basic credentials keep working.
 *
 * Keep this file pure and dependency-free: it runs in the proxy on every
 * request, and lib/bot-guard.test.ts pins the behaviour.
 */

/** Always reachable, by anyone: liveness checks and the robots policy itself. */
export const ALWAYS_OPEN = new Set(["/robots.txt", "/api/health", "/health", "/api/v1/health/db"]);

/**
 * Link-preview fetchers. They only ever see the /beta landing (no pass → 307),
 * and blocking them would break unfurls when the founder shares the link.
 * Vercel's own agents (cron, deploy checks) start with "vercel".
 */
const ALLOW_UA =
  /^vercel|\bvercel-(?:cron|screenshot|favicon)\b|Slackbot|Slack-ImgProxy|Twitterbot|facebookexternalhit|LinkedInBot|Discordbot|WhatsApp|TelegramBot|SkypeUriPreview|Iframely|Embedly/i;

/** AI training / answer-engine crawlers, by their published tokens. */
const AI_CRAWLERS = [
  "GPTBot", "ChatGPT-User", "OAI-SearchBot", "CCBot", "ClaudeBot", "Claude-Web", "Claude-User",
  "Claude-SearchBot", "anthropic-ai", "PerplexityBot", "Perplexity-User", "Bytespider", "Amazonbot",
  "Applebot-Extended", "meta-externalagent", "meta-externalfetcher", "FacebookBot", "Diffbot",
  "ImagesiftBot", "Omgili", "cohere-ai", "cohere-training-data-crawler", "YouBot", "Timpibot",
  "DuckAssistBot", "MistralAI-User", "AI2Bot", "PanguBot", "img2dataset", "Webzio", "ICC-Crawler",
  "GoogleOther", "Google-CloudVertexBot", "Scrapy", "Kangaroo Bot", "Sidetrade", "Brightbot",
];

/** Vulnerability scanners and internet-wide mappers. */
const SCANNERS = [
  "sqlmap", "nikto", "nuclei", "nmap", "masscan", "zgrab", "zmap", "dirbuster", "gobuster",
  "feroxbuster", "ffuf", "wfuzz", "wpscan", "joomscan", "acunetix", "netsparker", "invicti",
  "qualys", "nessus", "openvas", "w3af", "whatweb", "arachni", "skipfish", "jaeles", "censys",
  "shodan", "expanse", "internet-measurement", "leakix", "binaryedge", "modatscanner",
  "projectdiscovery", "interactsh", "httpx", "commix", "hydra", "burp", "owasp zap", "zap/",
  "wappalyzer", "builtwith", "netcraft", "paloalto", "palo alto networks", "detectify",
];

/** HTTP libraries and automation drivers — a person never browses with these. */
const AUTOMATION = [
  "headlesschrome", "phantomjs", "puppeteer", "playwright", "selenium", "webdriver", "slimerjs",
  "python-requests", "python-urllib", "python-httpx", "aiohttp", "python/", "go-http-client",
  "java/", "okhttp", "apache-httpclient", "libwww-perl", "lwp::", "www-mechanize", "mechanize",
  "wget", "curl/", "httpie", "node-fetch", "axios/", "undici", "deno/", "bun/", "colly",
  "faraday", "restsharp", "typhoeus", "guzzlehttp", "reqwest", "dart:io", "winhttp", "nutch",
  "heritrix", "postmanruntime", "insomnia",
];

/**
 * Anything that announces itself as a crawler. Checked after ALLOW_UA. Crawler
 * UAs carry "SomethingBot/1.0", "SomethingBot;" or a "+http://…" contact URL —
 * a browser never does. Deliberately not a bare /bot/: that would catch phone
 * models such as "CUBOT X30".
 */
const GENERIC = /bot\/|bot;|bot\)|\+https?:\/\/|crawler|crawl\/|spider|scraper|slurp|archiver/i;

const BLOCK_TOKENS = [...AI_CRAWLERS, ...SCANNERS, ...AUTOMATION].map((t) => t.toLowerCase());

export type UAVerdict = "ok" | "blocked";

/**
 * Classify a User-Agent. A missing one is blocked: every real browser sends one.
 * Note for the future Android client (master-maths): OkHttp is on the list, so
 * it must authenticate (Basic or the beta cookie) — guests bypass this check.
 */
export function classifyUserAgent(ua: string | null | undefined): UAVerdict {
  const s = (ua ?? "").trim();
  if (!s) return "blocked";
  if (ALLOW_UA.test(s)) return "ok";
  if (/^node$/i.test(s)) return "blocked"; // Node's built-in fetch
  const lower = s.toLowerCase();
  if (BLOCK_TOKENS.some((t) => lower.includes(t))) return "blocked";
  if (GENERIC.test(s)) return "blocked";
  return "ok";
}

/**
 * Paths only a scanner asks for. None of these are routes in this app, so a
 * flat 404 costs a real visitor nothing and tells a scanner nothing.
 */
const PROBE_WORDS = [
  "\\.env", "\\.git", "\\.svn", "\\.hg", "\\.bzr", "\\.aws", "\\.ssh", "\\.docker", "\\.npmrc",
  "\\.vscode", "\\.idea", "\\.DS_Store", "\\.htaccess", "\\.htpasswd", "\\.circleci",
  "wp-admin", "wp-login", "wp-content", "wp-includes", "wp-json", "wp-config", "wordpress",
  "xmlrpc", "phpmyadmin", "pma", "myadmin", "adminer", "cgi-bin", "server-status", "server-info",
  "actuator", "vendor/phpunit", "telescope", "_profiler", "_ignition", "boaform", "hnap1", "owa",
  "ecp", "autodiscover", "solr", "jenkins", "manager/html", "druid", "nacos", "geoserver",
  "remote/login", "admin", "administrator", "backup", "backups", "dump", "debug", "console",
];
const PROBE_PREFIX = new RegExp(`^/(?:${PROBE_WORDS.join("|")})(?:[/.?]|$)`, "i");

/** File types this app never serves; a request for one is a scanner. */
const PROBE_EXT = /\.(?:php\d?|phtml|asp|aspx|ashx|jsp|jspx|cfm|cgi|pl|bak|old|orig|save|swp|sql|sqlite3?|mdb|ini|env|log|conf|cfg|tar|tgz|gz|bz2|zip|rar|7z|pem|key|crt|p12|pfx|kdbx)$/i;

export function isProbePath(path: string): boolean {
  return PROBE_PREFIX.test(path) || PROBE_EXT.test(path) || path.includes("/../") || /%2e%2e/i.test(path);
}

/* ── Viewer identity cookies (for the screenshot watermark) ───────────────── */

/** Readable by page script, on purpose: it only carries the guest's username. */
export const VIEWER_COOKIE = "mg_viewer";
/** "1" lets this viewer capture screens (founder deck work). Set from env only. */
export const CAPTURE_COOKIE = "mg_cap";

/** `CAPTURE_ALLOWED_USERS` — comma-separated guest usernames exempt from capture deterrents. */
export function captureAllowed(user: string): boolean {
  return (process.env.CAPTURE_ALLOWED_USERS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(user);
}
