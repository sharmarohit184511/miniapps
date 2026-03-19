"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FigmaNewsDayCard,
  type DayBlock,
} from "@/components/figma-home/figma-news-day-card";
import { useFigmaDayBriefingPlayer } from "@/components/figma-home/use-figma-day-briefing-player";

const FEED_DAYS = 10;

export function FigmaNewsFeed({
  className,
  sectionTitle = "News feed",
}: {
  className?: string;
  /** Figma: &quot;News &amp; Updates&quot; */
  sectionTitle?: string;
}) {
  const [days, setDays] = useState<DayBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [fillLoading, setFillLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState<Record<string, boolean>>({});

  const {
    audioRef,
    generatingFor,
    briefingErr,
    activeAudioDate,
    playing,
    startConversationBriefing,
    audioDurationByDate,
  } = useFigmaDayBriefingPlayer();

  const load = useCallback(async (fill: boolean) => {
    if (fill) setFillLoading(true);
    else setLoading(true);
    setErr(null);
    try {
      const r = await fetch(
        `/api/figma-daily-feed?days=${FEED_DAYS}&lang=en&fill=${fill ? "1" : "0"}`,
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

  useEffect(() => {
    load(false);
  }, [load]);

  const toggleSummary = (date: string) => {
    setSummaryOpen((prev) => ({ ...prev, [date]: !prev[date] }));
  };

  const today = days[0];
  const pastDays = days.slice(1);

  return (
    <section className={cn("mt-8", className)} aria-label="News feed">
      <audio ref={audioRef} className="hidden" preload="auto" />

      <div
        className={cn(
          "overflow-hidden rounded-[24px] bg-white p-4 shadow-[0_4px_16px_rgba(0,0,0,0.08)]",
          "ring-1 ring-black/[0.04]"
        )}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#e8eef2] pb-4">
          <h2 className="text-base font-black tracking-[-0.48px] text-[#141414]">
            {sectionTitle}
          </h2>
          <button
            type="button"
            disabled={fillLoading || loading}
            onClick={() => load(true)}
            className="inline-flex items-center gap-1 rounded-lg bg-[#0078ad] px-2.5 py-1 text-[11px] font-bold text-white shadow-sm transition hover:bg-[#006a99] disabled:opacity-50"
          >
            {fillLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            Refresh
          </button>
        </div>

        {err && (
          <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {err}
          </p>
        )}

        {loading && (
          <div className="flex items-center gap-2 py-2 text-sm text-black/50">
            <Loader2 className="size-5 animate-spin text-[#0078ad]" />
            Loading headlines…
          </div>
        )}

        {!loading && today && (
          <FigmaNewsDayCard
            day={today}
            isToday
            generatingFor={generatingFor}
            activeAudioDate={activeAudioDate}
            playing={playing}
            summaryExpanded={summaryOpen[today.date] ?? false}
            briefingErr={briefingErr}
            audioDurationByDate={audioDurationByDate}
            onPlay={startConversationBriefing}
            onToggleSummary={toggleSummary}
          />
        )}

        {!loading && pastDays.length > 0 && (
          <Link
            href="/dashboard/ai-news-briefing/past-summaries"
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#0078ad]/35 bg-[#f5fafd] px-4 py-2.5 text-sm font-semibold text-[#013e7c] transition-colors hover:bg-[#eef6fb]"
          >
            See past summaries
            <ChevronRight className="size-4" />
          </Link>
        )}

        {!loading && !today && !err && (
          <p className="py-2 text-sm text-black/50">No feed data yet.</p>
        )}
      </div>
    </section>
  );
}
