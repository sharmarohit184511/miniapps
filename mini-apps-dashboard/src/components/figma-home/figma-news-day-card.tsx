"use client";

import { Loader2, Pause, Play } from "lucide-react";

export type DayBlock = {
  date: string;
  dayLabel: string;
  day_summary: string | null;
  sections: {
    key: string;
    title: string;
    articles: { url: string; title: string; source: string }[];
    blurb: string | null;
  }[];
  digestReady: boolean;
  error?: string;
};

const TERTIARY_MAX = 52;

function truncateTertiary(s: string, max = TERTIARY_MAX): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/** ~N min from seconds (at least 1). */
function formatBriefingMinutes(seconds: number): string {
  const m = Math.max(1, Math.round(seconds / 60));
  return `~${m} min`;
}

/** Short topic line from digest sections / first headline. */
export function buildTopicTeaser(day: DayBlock): string {
  const titles = day.sections
    .map((s) => s.title?.trim())
    .filter(Boolean) as string[];
  if (titles.length > 0) {
    const joined = titles.slice(0, 2).join(" · ");
    return truncateTertiary(joined, 44);
  }
  const firstTitle = day.sections.flatMap((s) => s.articles)[0]?.title?.trim();
  if (firstTitle) return truncateTertiary(firstTitle, 44);
  return "";
}

function tertiaryTodayLine(
  day: DayBlock,
  ctx: {
    generating: boolean;
    isActivePlaying: boolean;
    durationSec?: number;
  }
): string {
  if (ctx.generating) {
    return "Making your briefing (~1–2 min)…";
  }
  const teaser = buildTopicTeaser(day);
  if (ctx.isActivePlaying) {
    const dur =
      ctx.durationSec !== undefined
        ? `${formatBriefingMinutes(ctx.durationSec)} · `
        : "";
    return truncateTertiary(`Playing · ${dur}two hosts`);
  }
  if (ctx.durationSec !== undefined) {
    const head = teaser ? `${teaser} · ` : "";
    return truncateTertiary(`${head}${formatBriefingMinutes(ctx.durationSec)}`);
  }
  if (teaser) {
    return truncateTertiary(`${teaser} · tap play`);
  }
  return "Tap play for audio";
}

function tertiaryPastLine(
  day: DayBlock,
  durationSec?: number
): string {
  const kind = day.digestReady ? "Daily podcast" : "Headlines";
  const teaser = buildTopicTeaser(day);
  const dur =
    durationSec !== undefined ? formatBriefingMinutes(durationSec) : null;
  const parts: string[] = [kind];
  if (teaser) parts.push(teaser);
  if (dur) parts.push(dur);
  parts.push("Tap play");
  return truncateTertiary(parts.join(" · "));
}

export function DayDigestPanel({ day }: { day: DayBlock }) {
  return (
    <div className="space-y-3 text-black/55">
      {day.error && <p className="text-xs text-red-600">{day.error}</p>}
      {day.day_summary && (
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-black/40">
            Day in review
          </p>
          <p className="mt-0.5 text-[11px] leading-relaxed">{day.day_summary}</p>
        </div>
      )}
      {day.sections.map((sec) => (
        <div key={sec.key}>
          <h4 className="text-[10px] font-bold uppercase tracking-wide text-black/45">
            {sec.title}
          </h4>
          {sec.blurb && (
            <p className="mt-0.5 text-[11px] leading-relaxed">{sec.blurb}</p>
          )}
          <ul className="mt-1.5 space-y-1">
            {sec.articles.length === 0 && (
              <li className="text-[10px] text-black/40">
                No articles for this window.
              </li>
            )}
            {sec.articles.map((a) => (
              <li key={a.url} className="text-[10px] leading-snug">
                <span className="text-black/60">{a.title}</span>
                <span className="text-black/35"> · {a.source}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

type DayCardProps = {
  day: DayBlock;
  isToday: boolean;
  generatingFor: string | null;
  /** Composite `date::lang` from feedPlaybackKey. */
  playbackKey: string;
  activeAudioKey: string | null;
  playing: boolean;
  briefingErr: Record<string, string>;
  /** Known audio length per playback key (sec), from prior playback metadata. */
  audioDurationByKey?: Record<string, number>;
  onPlay: () => void;
};

export function FigmaNewsDayCard({
  day,
  isToday,
  generatingFor,
  playbackKey,
  activeAudioKey,
  playing,
  briefingErr,
  audioDurationByKey,
  onPlay,
}: DayCardProps) {
  const gen = generatingFor === playbackKey;
  const isActivePlaying = activeAudioKey === playbackKey && playing;
  const bErr = briefingErr[playbackKey];
  const durationSec = audioDurationByKey?.[playbackKey];

  return (
    <div className="mb-0 overflow-hidden rounded-xl bg-white/90 ring-1 ring-[#0078ad]/15">
      <div className="flex items-center gap-2.5 px-2.5 py-2.5">
        <button
          type="button"
          disabled={!!generatingFor && !gen}
          onClick={onPlay}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-[#0078ad] text-white shadow-[0_2px_8px_rgba(0,120,173,0.35)] transition hover:bg-[#006a99] active:scale-[0.97] disabled:opacity-50"
          aria-label={
            gen
              ? "Generating conversation briefing"
              : isActivePlaying
                ? "Pause"
                : "Play conversation briefing"
          }
        >
          <span className="flex size-5 items-center justify-center [&_svg]:size-5">
            {gen ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : isActivePlaying ? (
              <Pause fill="currentColor" aria-hidden />
            ) : (
              <Play className="translate-x-px" fill="currentColor" aria-hidden />
            )}
          </span>
        </button>
        <div className="min-w-0 flex-1">
          {!isToday ? (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[#0078ad]/90">
                {day.dayLabel}
              </span>
            </div>
          ) : null}
          <p
            className={
              isToday
                ? "text-[13px] font-semibold leading-tight tracking-[-0.02em] text-[#1a1a1a]"
                : "mt-0.5 text-[13px] font-semibold leading-tight tracking-[-0.02em] text-[#1a1a1a]"
            }
          >
            {isToday ? day.dayLabel : day.date}
          </p>
          <p className="mt-0.5 line-clamp-2 min-h-[2.5rem] text-[11px] leading-snug text-black/50">
            {isToday
              ? tertiaryTodayLine(day, {
                  generating: gen,
                  isActivePlaying,
                  durationSec,
                })
              : tertiaryPastLine(day, durationSec)}
          </p>
          {bErr ? (
            <p className="mt-1 text-[10px] text-red-600">{bErr}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
