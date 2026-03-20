"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildTopicTeaser,
  FigmaNewsDayCard,
  type DayBlock,
} from "@/components/figma-home/figma-news-day-card";
import { useFigmaBriefing } from "@/components/figma-home/FigmaBriefingContext";
import { useFigmaDayBriefingPlayer } from "@/components/figma-home/use-figma-day-briefing-player";
import {
  readFigmaBriefingAudioCache,
  writeFigmaBriefingAudioCache,
} from "@/components/figma-home/figma-briefing-audio-cache";
import {
  feedPlaybackKey,
  FIGMA_WIDGET_LANG_STORAGE_KEY,
  type FigmaWidgetLang,
} from "@/components/figma-home/figma-widget-lang";
import { DEFAULT_FIGMA_FEED_DAYS } from "@/lib/figma-daily-feed-data";

const SUBLINE_MAX = 72;

function clipSub(s: string, max = SUBLINE_MAX): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function playbackKeyToDate(key: string | null): string | null {
  if (!key) return null;
  const i = key.indexOf("::");
  return i > 0 ? key.slice(0, i) : key;
}

export function FigmaNewsFeed({
  className,
  sectionTitle = "News feed",
  /** When set (e.g. from RSC home), skip the initial client fetch — data is already in HTML. */
  initialFeed,
}: {
  className?: string;
  /** Figma: &quot;News &amp; Updates&quot; */
  sectionTitle?: string;
  initialFeed?: { days: DayBlock[] };
}) {
  const [widgetLang, setWidgetLang] = useState<FigmaWidgetLang>("en");
  const [days, setDays] = useState<DayBlock[]>(() => initialFeed?.days ?? []);
  const [loading, setLoading] = useState(() => initialFeed === undefined);
  const [err, setErr] = useState<string | null>(null);
  const { setFeedMiniBar, setFeedAudio } = useFigmaBriefing();

  useEffect(() => {
    try {
      const s = localStorage.getItem(FIGMA_WIDGET_LANG_STORAGE_KEY);
      if (s === "hi" || s === "en") setWidgetLang(s);
    } catch {
      /* ignore */
    }
  }, []);

  const {
    audioRef,
    generatingFor,
    briefingErr,
    activeAudioKey,
    playing,
    startConversationBriefing,
    audioDurationByKey,
  } = useFigmaDayBriefingPlayer();

  const toggleFeedPlay = useCallback(() => {
    const el = audioRef.current;
    if (!el?.src) return;
    if (el.paused) void el.play();
    else el.pause();
  }, []);

  const seekFeedBy = useCallback((deltaSec: number) => {
    const el = audioRef.current;
    if (!el || !Number.isFinite(el.duration) || el.duration <= 0) return;
    el.currentTime = Math.max(
      0,
      Math.min(el.duration, el.currentTime + deltaSec)
    );
  }, []);

  const seekFeedTo = useCallback((sec: number) => {
    const el = audioRef.current;
    if (!el || !Number.isFinite(el.duration) || el.duration <= 0) return;
    el.currentTime = Math.max(0, Math.min(el.duration, sec));
  }, []);

  const feedControlsRef = useRef({
    toggleFeedPlay,
    seekFeedBy,
    seekFeedTo,
  });
  feedControlsRef.current = { toggleFeedPlay, seekFeedBy, seekFeedTo };

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(
        `/api/figma-daily-feed?days=${DEFAULT_FIGMA_FEED_DAYS}&lang=${widgetLang}&fill=0`,
        { cache: "no-store" }
      );
      const j = await r.json();
      if (!r.ok) {
        const main =
          typeof j.error === "string" ? j.error : "Could not load feed";
        const hint = typeof j.hint === "string" ? j.hint : "";
        setErr(hint ? `${main} ${hint}` : main);
        setDays([]);
        return;
      }
      setDays(Array.isArray(j.days) ? j.days : []);
    } catch {
      setErr("Network error — is the app running?");
      setDays([]);
    } finally {
      setLoading(false);
    }
  }, [widgetLang]);

  /** No server payload: fetch on mount. With `initialFeed` + English, skip until lang changes. */
  useEffect(() => {
    if (initialFeed !== undefined && widgetLang === "en") {
      setDays(initialFeed.days);
      setLoading(false);
      return;
    }
    load();
  }, [load, initialFeed, widgetLang]);

  const langLabel = widgetLang === "hi" ? "हिंदी" : "English";

  useEffect(() => {
    return () => {
      setFeedMiniBar(null);
      setFeedAudio(null);
    };
  }, [setFeedAudio, setFeedMiniBar]);

  /** Prefetch cached audio URLs for feed days so localStorage is warm before first play. */
  useEffect(() => {
    if (!days.length) return;
    let cancelled = false;
    void (async () => {
      for (const day of days) {
        if (cancelled) break;
        const date = day.date;
        if (readFigmaBriefingAudioCache(date, widgetLang)) continue;
        try {
          const r = await fetch(
            `/api/figma-day-briefing?date=${encodeURIComponent(date)}&lang=${widgetLang}`,
            { cache: "no-store" }
          );
          if (!r.ok) continue;
          const j = (await r.json()) as {
            audio_url?: string;
            briefingId?: string;
          };
          if (typeof j.audio_url === "string" && j.audio_url.trim()) {
            writeFigmaBriefingAudioCache(date, widgetLang, {
              audioUrl: j.audio_url.trim(),
              ...(typeof j.briefingId === "string" && j.briefingId.trim()
                ? { briefingId: j.briefingId.trim() }
                : {}),
            });
          }
        } catch {
          /* ignore */
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [days, widgetLang]);

  const activeDateForBar = playbackKeyToDate(activeAudioKey);
  const generatingDateForBar = playbackKeyToDate(generatingFor);

  /** Sticky mini player: same date/day + topic cues as the day cards. */
  useEffect(() => {
    const today = days[0];
    const g = generatingDateForBar;
    if (g) {
      const d = days.find((x) => x.date === g);
      setFeedMiniBar({
        eyebrow: "Preparing audio",
        title: d?.dayLabel ?? g,
        subline: clipSub(`Akshay & Kriti · ${langLabel} · Generating your podcast…`),
      });
      return;
    }
    if (activeDateForBar && playing) {
      const d = days.find((x) => x.date === activeDateForBar);
      const isToday = Boolean(d && today && d.date === today.date);
      const teaser = d ? buildTopicTeaser(d) : "";
      setFeedMiniBar({
        eyebrow: isToday ? "Today" : "Now playing",
        title: d ? d.dayLabel : activeDateForBar,
        subline: clipSub(
          teaser
            ? `${teaser} · Akshay & Kriti · ${langLabel}`
            : `Conversation · Akshay & Kriti · ${langLabel}`
        ),
      });
      return;
    }
    if (activeDateForBar && !playing) {
      const d = days.find((x) => x.date === activeDateForBar);
      const isToday = Boolean(d && today && d.date === today.date);
      const dur =
        activeAudioKey != null ? audioDurationByKey[activeAudioKey] : undefined;
      const teaser = d ? buildTopicTeaser(d) : "";
      const durPart =
        dur != null
          ? `~${Math.max(1, Math.round(dur / 60))} min · `
          : "";
      setFeedMiniBar({
        eyebrow: isToday ? "Today" : "Paused",
        title: d ? d.dayLabel : activeDateForBar,
        subline: clipSub(
          `${durPart}${teaser || `Tap play to resume · ${langLabel}`}`
        ),
      });
      return;
    }
    if (today) {
      const teaser = buildTopicTeaser(today);
      setFeedMiniBar({
        eyebrow: "Today",
        title: today.dayLabel,
        subline: clipSub(
          teaser
            ? `${teaser} · Tap play · ${langLabel}`
            : `Akshay & Kriti · Tap play · ${langLabel}`
        ),
      });
      return;
    }
    setFeedMiniBar(null);
  }, [
    days,
    generatingDateForBar,
    activeDateForBar,
    activeAudioKey,
    playing,
    audioDurationByKey,
    widgetLang,
    langLabel,
    setFeedMiniBar,
  ]);

  /** Bridge feed <audio> to the sticky player when conversation audio is loaded. */
  useEffect(() => {
    const el = audioRef.current;
    if (!el) {
      setFeedAudio(null);
      return;
    }
    const sync = () => {
      const dur = el.duration;
      const durationSec =
        typeof dur === "number" && Number.isFinite(dur) && dur > 0 ? dur : 0;
      const hasSrc = Boolean(el.currentSrc || el.src);
      const active = hasSrc && activeAudioKey != null;
      const c = feedControlsRef.current;
      setFeedAudio({
        active,
        playing: !el.paused,
        currentSec: el.currentTime,
        durationSec,
        togglePlay: () => {
          c.toggleFeedPlay();
        },
        seekBy: (d: number) => {
          c.seekFeedBy(d);
        },
        seekTo: (t: number) => {
          c.seekFeedTo(t);
        },
      });
    };
    el.addEventListener("timeupdate", sync);
    el.addEventListener("loadedmetadata", sync);
    el.addEventListener("play", sync);
    el.addEventListener("pause", sync);
    el.addEventListener("ended", sync);
    el.addEventListener("seeked", sync);
    sync();
    return () => {
      el.removeEventListener("timeupdate", sync);
      el.removeEventListener("loadedmetadata", sync);
      el.removeEventListener("play", sync);
      el.removeEventListener("pause", sync);
      el.removeEventListener("ended", sync);
      el.removeEventListener("seeked", sync);
      setFeedAudio(null);
    };
  }, [activeAudioKey, setFeedAudio]);

  const today = days[0];
  const pastDays = days.slice(1);
  const todayPlaybackKey = today
    ? feedPlaybackKey(today.date, widgetLang)
    : "";

  return (
    <section className={cn("mt-8", className)} aria-label="News feed">
      <audio ref={audioRef} className="hidden" preload="auto" />

      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-[#0078ad]/[0.12] bg-gradient-to-b from-[#eef6fc] via-white to-white p-3",
          "shadow-[0_2px_16px_rgba(1,62,124,0.07)]"
        )}
      >
        <header className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div className="min-w-0">
            <h2 className="bg-gradient-to-r from-[#013e7c] via-[#0078ad] to-[#0a6b8a] bg-clip-text text-[1.5rem] font-black leading-[1.15] tracking-[-0.045em] text-transparent">
              {sectionTitle}
            </h2>
            <p className="mt-1.5 text-[12px] font-medium leading-snug text-black/48">
              Tap play for today&apos;s AI News Podcast
            </p>
          </div>
          <label className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-[#013e7c]/80">
            <span className="sr-only">Podcast language</span>
            <select
              value={widgetLang}
              onChange={(e) => {
                const next = e.target.value === "hi" ? "hi" : "en";
                try {
                  localStorage.setItem(FIGMA_WIDGET_LANG_STORAGE_KEY, next);
                } catch {
                  /* ignore */
                }
                setWidgetLang(next);
              }}
              className="rounded-lg border border-[#0078ad]/25 bg-white px-2 py-1.5 text-[12px] font-bold text-[#013e7c] shadow-sm outline-none ring-[#0078ad]/20 focus:ring-2"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
            </select>
          </label>
        </header>

        {err && (
          <p className="mb-2 rounded-lg border border-amber-200/80 bg-amber-50/90 px-2.5 py-2 text-[11px] leading-snug text-amber-900">
            {err}
          </p>
        )}

        {loading && (
          <div className="flex items-center gap-2 py-3 text-[13px] text-black/45">
            <Loader2 className="size-4 animate-spin text-[#0078ad]" />
            Loading…
          </div>
        )}

        {!loading && today && (
          <FigmaNewsDayCard
            day={today}
            isToday
            generatingFor={generatingFor}
            playbackKey={todayPlaybackKey}
            activeAudioKey={activeAudioKey}
            playing={playing}
            briefingErr={briefingErr}
            audioDurationByKey={audioDurationByKey}
            onPlay={() => startConversationBriefing(today.date, widgetLang)}
          />
        )}

        {!loading && pastDays.length > 0 && (
          <Link
            href="/dashboard/ai-news-briefing/past-summaries"
            className="mt-2 flex w-full items-center justify-center gap-0.5 rounded-lg py-2 text-[12px] font-bold text-[#0078ad] transition hover:text-[#006a99]"
          >
            Past days &amp; summaries
            <ChevronRight className="size-3.5" strokeWidth={2.5} />
          </Link>
        )}

        {!loading && !today && !err && (
          <p className="py-2 text-sm text-black/50">No feed data yet.</p>
        )}
      </div>
    </section>
  );
}
