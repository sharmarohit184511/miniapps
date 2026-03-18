import type { NextRequest } from "next/server";

/** Same-origin base for server fetch to briefing APIs on this app. */
export function getBriefingApiOrigin(request: NextRequest): string {
  return request.nextUrl.origin;
}

/** Fallback when no Request (workers / scripts). */
export function getBriefingApiBase(): string {
  const raw =
    process.env.AI_NEWS_BRIEFING_URL?.trim() ||
    process.env.NEXT_PUBLIC_AI_NEWS_BRIEFING_URL?.trim() ||
    "";
  if (raw) return raw.replace(/\/$/, "");
  if (process.env.RENDER_EXTERNAL_URL)
    return process.env.RENDER_EXTERNAL_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL)
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  return "http://127.0.0.1:3000";
}
