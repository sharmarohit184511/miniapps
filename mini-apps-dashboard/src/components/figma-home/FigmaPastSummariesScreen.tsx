"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Loader2 } from "lucide-react";
import { AiNewsBriefingBottomWidget } from "./AiNewsBriefingBottomWidget";
import { FigmaBottomNav } from "./FigmaBottomNav";
import { FigmaBriefingProvider } from "./FigmaBriefingContext";
import {
  FigmaNewsDayCard,
  type DayBlock,
} from "@/components/figma-home/figma-news-day-card";
import { useFigmaDayBriefingPlayer } from "@/components/figma-home/use-figma-day-briefing-player";

const FEED_DAYS = 10;

type Props = {
  briefingUrl: string;
};

export function FigmaPastSummariesScreen({ briefingUrl }: Props) {
  const [days, setDays] = useState<DayBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState<Record<string, boolean>>({});

  const {
    audioRef,
    generatingFor,
    briefingErr,
    activeAudioDate,
    playing,
    startConversationBriefing,
  } = useFigmaDayBriefingPlayer();

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(
        `/api/figma-daily-feed?days=${FEED_DAYS}&lang=en&fill=0`,
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
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pastDays = days.slice(1);

  const inner = (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[360px] flex-col bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.04)]">
      <main className="flex-1 overflow-y-auto px-6 pb-[220px] pt-5">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-[#013e7c] hover:underline"
        >
          <ChevronLeft className="size-4" />
          Figma journey
        </Link>
        <h1 className="text-lg font-bold tracking-tight text-[#141414]">
          Past summaries
        </h1>
        <p className="mt-0.5 text-xs text-black/50">
          Newest past days first (conversation play per date)
        </p>

        <audio ref={audioRef} className="hidden" preload="auto" />

        {err && (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {err}
          </p>
        )}

        {loading && (
          <div className="mt-6 flex items-center gap-2 text-sm text-black/50">
            <Loader2 className="size-5 animate-spin text-[#0078ad]" />
            Loading…
          </div>
        )}

        {!loading &&
          pastDays.map((day) => (
            <div key={day.date} className="mt-4">
              <FigmaNewsDayCard
                day={day}
                isToday={false}
                generatingFor={generatingFor}
                activeAudioDate={activeAudioDate}
                playing={playing}
                summaryExpanded={summaryOpen[day.date] ?? false}
                briefingErr={briefingErr}
                onPlay={startConversationBriefing}
                onToggleSummary={(d) =>
                  setSummaryOpen((prev) => ({ ...prev, [d]: !prev[d] }))
                }
              />
            </div>
          ))}

        {!loading && !pastDays.length && !err && (
          <p className="mt-6 text-sm text-black/50">No past days in feed.</p>
        )}
      </main>

      <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-[360px] -translate-x-1/2 bg-white">
        <AiNewsBriefingBottomWidget briefingUrl={briefingUrl} />
        <FigmaBottomNav />
      </div>
    </div>
  );

  return (
    <FigmaBriefingProvider briefingUrl={briefingUrl}>{inner}</FigmaBriefingProvider>
  );
}
