"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildTopicTeaser,
  FigmaNewsDayCard,
  type DayBlock,
} from "@/components/figma-home/figma-news-day-card";
import { useFigmaBriefing } from "@/components/figma-home/FigmaBriefingContext";
import { useFigmaDayBriefingPlayer } from "@/components/figma-home/use-figma-day-briefing-player";
import { DEFAULT_FIGMA_FEED_DAYS } from "@/lib/figma-daily-feed-data";

const SUBLINE_MAX = 72;

function clipSub(s: string, max = SUBLINE_MAX): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
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
  const [days, setDays] = useState<DayBlock[]>(() => initialFeed?.days ?? []);
  const [loading, setLoading] = useState(() => initialFeed === undefined);
  const [fillLoading, setFillLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { setFeedMiniBar, setFeedAudio } = useFigmaBriefing();

  const {
    audioRef,
    generatingFor,
    briefingErr,
    activeAudioDate,
    playing,
    startConversationBriefing,
    audioDurationByDate,
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

  const load = useCallback(async (fill: boolean) => {
    if (fill) setFillLoading(true);
    else setLoading(true);
    setErr(null);
    try {
      const r = await fetch(
        `/api/figma-daily-feed?days=${DEFAULT_FIGMA_FEED_DAYS}&lang=en&fill=${fill ? "1" : "0"}`,
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
      setErr("Network error — is the briefing app running?");
      setDays([]);
    } finally {
      setLoading(false);
      setFillLoading(false);
    }
  }, []);

  /** No server payload: fetch on mount. Home passes `initialFeed` to avoid duplicate work. */
  useEffect(() => {
    if (initialFeed !== undefined) return;
    load(false);
  }, [load, initialFeed]);

  useEffect(() => {
    return () => {
      setFeedMiniBar(null);
      setFeedAudio(null);
    };
  }, [setFeedAudio, setFeedMiniBar]);

  /** Sticky mini player: same date/day + topic cues as the day cards. */
  useEffect(() => {
    const today = days[0];
    const g = generatingFor;
    if (g) {
      const d = days.find((x) => x.date === g);
      setFeedMiniBar({
        eyebrow: "Preparing audio",
        title: d?.dayLabel ?? g,
        subline: clipSub("Akshay & Kriti · Generating conversation briefing…"),
      });
      return;
    }
    if (activeAudioDate && playing) {
      const d = days.find((x) => x.date === activeAudioDate);
      const isToday = Boolean(d && today && d.date === today.date);
      const teaser = d ? buildTopicTeaser(d) : "";
      setFeedMiniBar({
        eyebrow: isToday ? "Today" : "Now playing",
        title: d ? d.dayLabel : activeAudioDate,
        subline: clipSub(
          teaser
            ? `${teaser} · Akshay & Kriti`
            : "Conversation · Akshay & Kriti · English"
        ),
      });
      return;
    }
    if (activeAudioDate && !playing) {
      const d = days.find((x) => x.date === activeAudioDate);
      const isToday = Boolean(d && today && d.date === today.date);
      const dur = audioDurationByDate[activeAudioDate];
      const teaser = d ? buildTopicTeaser(d) : "";
      const durPart =
        dur != null
          ? `~${Math.max(1, Math.round(dur / 60))} min · `
          : "";
      setFeedMiniBar({
        eyebrow: isToday ? "Today" : "Paused",
        title: d ? d.dayLabel : activeAudioDate,
        subline: clipSub(
          `${durPart}${teaser || "Tap play to resume · English"}`
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
            ? `${teaser} · Tap play · English`
            : "Akshay & Kriti · Tap play · English"
        ),
      });
      return;
    }
    setFeedMiniBar(null);
  }, [
    days,
    generatingFor,
    activeAudioDate,
    playing,
    audioDurationByDate,
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
      const active = hasSrc && activeAudioDate != null;
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
  }, [activeAudioDate, setFeedAudio]);

  const today = days[0];
  const pastDays = days.slice(1);

  return (
    <section className={cn("mt-8", className)} aria-label="News feed">
      <audio ref={audioRef} className="hidden" preload="auto" />

      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-[#0078ad]/[0.12] bg-gradient-to-b from-[#eef6fc] via-white to-white p-3",
          "shadow-[0_2px_16px_rgba(1,62,124,0.07)]"
        )}
      >
        <header className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="bg-gradient-to-r from-[#013e7c] via-[#0078ad] to-[#0a6b8a] bg-clip-text text-[1.5rem] font-black leading-[1.15] tracking-[-0.045em] text-transparent">
              {sectionTitle}
            </h2>
            <p className="mt-1.5 text-[12px] font-medium leading-snug text-black/48">
              Tap play for today&apos;s audio briefing
            </p>
          </div>
          <button
            type="button"
            disabled={fillLoading || loading}
            onClick={() => load(true)}
            title="Refresh feed"
            className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[#0078ad] shadow-sm ring-1 ring-[#0078ad]/20 transition hover:bg-[#f5fafd] disabled:opacity-45"
          >
            {fillLoading ? (
              <Loader2 className="size-[18px] animate-spin" />
            ) : (
              <RefreshCw className="size-[18px]" strokeWidth={2.25} />
            )}
          </button>
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
            activeAudioDate={activeAudioDate}
            playing={playing}
            briefingErr={briefingErr}
            audioDurationByDate={audioDurationByDate}
            onPlay={startConversationBriefing}
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
