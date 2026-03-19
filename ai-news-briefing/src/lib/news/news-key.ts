import { existsSync, readFileSync } from "fs";
import { join } from "path";

/**
 * News routes run in ai-news-briefing, which only loads this app's .env.local.
 * If NEWS_API_KEY is set in mini-apps-dashboard/.env.local (common with dev:all),
 * read it from there when missing here.
 */
function parseNewsApiKeyFromEnvFile(filePath: string): string | undefined {
  if (!existsSync(filePath)) return undefined;
  const text = readFileSync(filePath, "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const m = t.match(/^NEWS_API_KEY\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[1].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    v = v.replace(/\s+#.*$/, "").trim();
    return v || undefined;
  }
  return undefined;
}

/** Walk up from cwd so it still works if Next uses a parent folder as cwd. */
function resolveDashboardEnvLocal(): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  let dir = process.cwd();
  for (let i = 0; i < 10; i++) {
    const p = join(dir, "mini-apps-dashboard", ".env.local");
    if (!seen.has(p)) {
      seen.add(p);
      out.push(p);
    }
    const parent = join(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  return out;
}

let memo: string | undefined | null = null;

/** In production, cache the resolved key once. In development, re-parse `.env.local` from disk each call so key edits apply without restarting `next dev`. */
function shouldMemoizeKey(): boolean {
  return process.env.NODE_ENV === "production";
}

function envFileCandidates(): string[] {
  const cwd = process.cwd();
  const paths = new Set<string>();
  const add = (p: string) => {
    if (p && !paths.has(p)) paths.add(p);
  };
  add(join(cwd, ".env.local"));
  // Repo layout: Mini Apps/ai-news-briefing + Mini Apps/mini-apps-dashboard
  add(join(cwd, "..", "mini-apps-dashboard", ".env.local"));
  add(join(cwd, "mini-apps-dashboard", ".env.local"));
  for (const p of resolveDashboardEnvLocal()) add(p);
  return [...paths];
}

function keyFromEnvFiles(): string | undefined {
  for (const p of envFileCandidates()) {
    const k = parseNewsApiKeyFromEnvFile(p);
    if (k) return k;
  }
  return undefined;
}

export function getNewsApiKey(): string | undefined {
  const memoize = shouldMemoizeKey();
  if (memoize && memo !== null) return memo || undefined;

  // Dev: read `.env.local` from disk first. Next.js freezes `process.env` from the initial
  // load, so edits to `.env.local` only apply after a restart unless we re-parse the file.
  if (!memoize) {
    const fromFile = keyFromEnvFiles();
    if (fromFile) return fromFile;
    const direct = process.env.NEWS_API_KEY?.trim();
    if (direct) return direct;
    return undefined;
  }

  const direct = process.env.NEWS_API_KEY?.trim();
  if (direct) {
    memo = direct;
    return direct;
  }
  const fromFile = keyFromEnvFiles();
  if (fromFile) {
    memo = fromFile;
    return fromFile;
  }
  memo = undefined;
  return undefined;
}
