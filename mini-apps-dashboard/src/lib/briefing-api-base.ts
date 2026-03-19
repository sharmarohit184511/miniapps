import type { NextRequest } from "next/server";

/**
 * Public base URL for server-side `fetch()` to this app’s own API routes.
 *
 * Behind Render/Vercel/other proxies, `request.nextUrl.origin` is often wrong (e.g.
 * `https://localhost:10000` — internal bind port). Prefer env + `X-Forwarded-*`.
 */
export function getBriefingApiOrigin(request: NextRequest): string {
  const trimSlash = (u: string) => u.replace(/\/$/, "");

  const explicit =
    process.env.AI_NEWS_BRIEFING_URL?.trim() ||
    process.env.NEXT_PUBLIC_AI_NEWS_BRIEFING_URL?.trim();
  if (explicit) return trimSlash(explicit);

  const render = process.env.RENDER_EXTERNAL_URL?.trim();
  if (render) return trimSlash(render);

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return trimSlash(`https://${vercel}`);

  const publicApp = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (publicApp) return trimSlash(publicApp);

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (forwardedHost) {
    const proto =
      request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
    return `${proto}://${forwardedHost}`;
  }

  return request.nextUrl.origin;
}

/** Fallback when no Request (workers / scripts). */
export function getBriefingApiBase(): string {
  const raw =
    process.env.AI_NEWS_BRIEFING_URL?.trim() ||
    process.env.NEXT_PUBLIC_AI_NEWS_BRIEFING_URL?.trim() ||
    "";
  if (raw) return raw.replace(/\/$/, "");
  if (process.env.RENDER_EXTERNAL_URL) return process.env.RENDER_EXTERNAL_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL)
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  const pub = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (pub) return pub.replace(/\/$/, "");
  return "http://127.0.0.1:3000";
}
