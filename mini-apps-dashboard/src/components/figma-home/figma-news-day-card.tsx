"use client";

import { ChevronDown, FileText, Loader2, Pause, Play } from "lucide-react";

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
function buildTopicTeaser(day: DayBlock): string {
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
    return "Generating audio briefing — usually 1–2 min";
  }
  const teaser = buildTopicTeaser(day);
  if (ctx.isActivePlaying) {
    const dur =
      ctx.durationSec !== undefined
        ? `${formatBriefingMinutes(ctx.durationSec)} · `
        : "";
    return truncateTertiary(
      `Now playing · ${dur}Akshay & Kriti · English`
    );
  }
  if (ctx.durationSec !== undefined) {
    const head = teaser ? `${teaser} · ` : "";
    return truncateTertiary(
      `${head}${formatBriefingMinutes(ctx.durationSec)} · English`
    );
  }
  if (teaser) {
    return truncateTertiary(`${teaser} · Tap play · English`);
  }
  return "Akshay & Kriti · Tap play · English";
}

function tertiaryPastLine(
  day: DayBlock,
  durationSec?: number
): string {
  const kind = day.digestReady ? "AI summary" : "Headlines";
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
    <div className="space-y-3 border-t border-[#e5f1f7] pt-3 text-black/55">
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
  activeAudioDate: string | null;
  playing: boolean;
  summaryExpanded: boolean;
  briefingErr: Record<string, string>;
  /** Known audio length per date (sec), from prior playback metadata. */
  audioDurationByDate?: Record<string, number>;
  onPlay: (date: string) => void;
  onToggleSummary: (date: string) => void;
};

export function FigmaNewsDayCard({
  day,
  isToday,
  generatingFor,
  activeAudioDate,
  playing,
  summaryExpanded,
  briefingErr,
  audioDurationByDate,
  onPlay,
  onToggleSummary,
}: DayCardProps) {
  const gen = generatingFor === day.date;
  const isActivePlaying = activeAudioDate === day.date && playing;
  const bErr = briefingErr[day.date];
  const durationSec = audioDurationByDate?.[day.date];

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-[#e5f1f7] bg-white shadow-sm">
      <div className="flex items-start gap-3 bg-gradient-to-r from-[#eef6fb] to-white px-4 py-3">
        <button
          type="button"
          disabled={!!generatingFor && !gen}
          onClick={() => onPlay(day.date)}
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#0078ad] text-white shadow-md transition hover:bg-[#006a99] disabled:opacity-50"
          aria-label={
            gen
              ? "Generating conversation briefing"
              : isActivePlaying
                ? "Pause"
                : "Play conversation briefing"
          }
        >
          {gen ? (
            <Loader2 className="size-6 animate-spin" />
          ) : isActivePlaying ? (
            <Pause className="size-6" fill="currentColor" />
          ) : (
            <Play className="size-6 translate-x-0.5" fill="currentColor" />
          )}
        </button>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#0078ad]">
            {isToday ? "Today" : day.dayLabel}
          </p>
          <p className="text-sm font-bold text-[#141414]">
            {isToday ? day.dayLabel : day.date}
          </p>
          <p className="text-[10px] leading-snug text-black/45">
            {isToday
              ? tertiaryTodayLine(day, {
                  generating: gen,
                  isActivePlaying,
                  durationSec,
                })
              : tertiaryPastLine(day, durationSec)}
          </p>
          {bErr ? (
            <p className="mt-1 text-[11px] text-red-600">{bErr}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onToggleSummary(day.date)}
          className="shrink-0 rounded-lg border border-[#e5f1f7] bg-white p-2 text-[#013e7c] hover:bg-[#f5fafd]"
          aria-expanded={summaryExpanded}
          aria-label={
            summaryExpanded ? "Hide written summary" : "Show written summary"
          }
        >
          <FileText className="size-4" />
          <ChevronDown
            className={`mx-auto mt-0.5 size-3 transition-transform ${summaryExpanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>
      {summaryExpanded && (
        <div className="px-4 pb-4">
          <DayDigestPanel day={day} />
        </div>
      )}
    </div>
  );
}
