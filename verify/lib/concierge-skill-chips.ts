/**
 * The concierge's quick-skill chips. Kept apart from lib/concierge-skills.ts, which reads the knowledge file from disk
 * and must stay on the server; this list is all the browser needs.
 */
export const SKILL_CHIPS = ["/explain perps", "/odds 62", "/kelly 60 2.0", "/fee 10000", "/moon", "/markets", "/status", "/help"] as const;
