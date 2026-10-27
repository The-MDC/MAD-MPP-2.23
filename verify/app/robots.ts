import type { MetadataRoute } from "next";

/**
 * Private beta: every crawler is asked to stay out of everything.
 *
 * `*` covers well-behaved crawlers. The AI agents are also named explicitly,
 * because some (Google-Extended, Applebot-Extended) are robots-only tokens that
 * a `*` rule does not opt out of model training. robots.txt is a request, not a
 * wall — proxy.ts (lib/bot-guard.ts) enforces the same thing with a 403.
 */
const AI_AGENTS = [
  "GPTBot", "ChatGPT-User", "OAI-SearchBot", "CCBot", "ClaudeBot", "Claude-Web", "Claude-User",
  "Claude-SearchBot", "anthropic-ai", "PerplexityBot", "Perplexity-User", "Google-Extended",
  "GoogleOther", "Applebot-Extended", "Bytespider", "Amazonbot", "meta-externalagent",
  "FacebookBot", "Diffbot", "cohere-ai", "YouBot", "DuckAssistBot", "MistralAI-User", "AI2Bot",
  "Timpibot", "ImagesiftBot", "Omgilibot", "Scrapy",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", disallow: "/" },
      { userAgent: AI_AGENTS, disallow: "/" },
    ],
  };
}
