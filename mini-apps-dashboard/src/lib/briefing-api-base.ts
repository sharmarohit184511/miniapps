/** Server-side base URL for AI News Briefing API (avoid browser CORS). */
export function getBriefingApiBase(): string {
  const raw =
    process.env.AI_NEWS_BRIEFING_URL?.trim() ||
    process.env.NEXT_PUBLIC_AI_NEWS_BRIEFING_URL?.trim() ||
    "http://localhost:3001";
  return raw.replace(/\/$/, "");
}
