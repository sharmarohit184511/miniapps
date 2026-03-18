"use client";

import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useFigmaBriefing } from "./FigmaBriefingContext";

type Props = {
  briefingUrl: string;
};

function fmtClock(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AiNewsBriefingBottomWidget({ briefingUrl }: Props) {
  const [expanded, setExpanded] = useState(false);
  const {
    state,
    playing,
    playbackRate,
    progress,
    togglePlay,
    seekBy,
    seekTo,
    setPlaybackRate,
  } = useFigmaBriefing();
  const speeds = [0.75, 1, 1.25, 1.5] as const;

  const ready = Boolean(state.audioUrl && state.status === "ready");
  const pct = useMemo(() => {
    const { currentSec, durationSec } = progress;
    if (!durationSec || durationSec <= 0) return 0;
    return Math.min(100, (currentSec / durationSec) * 100);
  }, [progress]);

  const subtitle = state.status === "generating"
    ? "Preparing…"
    : state.status === "error"
      ? "Unavailable"
      : ready
        ? `${fmtClock(progress.currentSec)} / ${fmtClock(progress.durationSec || state.durationSec || 0)}`
        : state.durationLabel;

  return (
    <div className="border-t border-[#e5f1f7] bg-[#121212] text-white shadow-[0_-4px_24px_rgba(0,0,0,0.15)]">
      {/* Progress bar */}
      <div
        role="slider"
        aria-valuenow={Math.round(progress.currentSec)}
        aria-valuemin={0}
        aria-valuemax={Math.round(progress.durationSec) || 100}
        className="h-1 w-full cursor-pointer bg-white/15"
        onClick={(e) => {
          if (!ready || !progress.durationSec) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          seekTo((x / rect.width) * progress.durationSec);
        }}
      >
        <div
          className="h-full bg-[#1ed760] transition-[width] duration-150 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="px-2 py-2">
        <div className="flex items-center gap-2">
          <div className="size-10 shrink-0 rounded bg-gradient-to-br from-[#8e116f] to-[#013e7c]" />

          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold leading-tight">
              {state.headline}
            </p>
            <p className="truncate text-[11px] text-white/60">{subtitle}</p>
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              disabled={!ready}
              onClick={() => seekBy(-10)}
              className="rounded-full p-1.5 text-white/90 hover:bg-white/10 disabled:opacity-30"
              aria-label="Back 10 seconds"
            >
              <SkipBack className="size-5" strokeWidth={2} />
            </button>
            <button
              type="button"
              disabled={!ready}
              onClick={togglePlay}
              className="flex size-9 items-center justify-center rounded-full bg-white text-black hover:scale-105 disabled:opacity-30"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? (
                <Pause className="size-4" fill="currentColor" />
              ) : (
                <Play className="size-4 translate-x-0.5 pl-px" fill="currentColor" />
              )}
            </button>
            <button
              type="button"
              disabled={!ready}
              onClick={() => seekBy(10)}
              className="rounded-full p-1.5 text-white/90 hover:bg-white/10 disabled:opacity-30"
              aria-label="Forward 10 seconds"
            >
              <SkipForward className="size-5" strokeWidth={2} />
            </button>
            <a
              href={state.fullAppNote ?? briefingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full p-1.5 text-white/70 hover:bg-white/10"
              aria-label="Open full app"
            >
              <ExternalLink className="size-4" />
            </a>
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="rounded-full p-1.5 text-white/70 hover:bg-white/10"
              aria-expanded={expanded}
              aria-label={expanded ? "Collapse" : "Expand briefing"}
            >
              {expanded ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </button>
          </div>
        </div>

        <div
          className={cn(
            "border-white/10",
            expanded && "mt-2 space-y-2 border-t pt-2"
          )}
        >
          {expanded && (
            <div className="flex flex-wrap justify-center gap-1">
              {speeds.map((r) => (
                <button
                  key={r}
                  type="button"
                  disabled={!ready}
                  onClick={() => setPlaybackRate(r)}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-semibold disabled:opacity-40",
                    playbackRate === r
                      ? "bg-[#1ed760] text-black"
                      : "bg-white/10 text-white/90"
                  )}
                >
                  {r}×
                </button>
              ))}
            </div>
          )}
          <div className="relative min-h-0 overflow-visible">
            <iframe
              title="AI News Briefing"
              src={`${briefingUrl}${briefingUrl.includes("?") ? "&" : "?"}figma_demo=1`}
              className={cn(
                "w-full bg-white transition-opacity duration-200",
                expanded
                  ? "relative z-10 mt-2 h-[220px] rounded-lg border border-white/10 opacity-100"
                  : "pointer-events-none absolute bottom-full left-0 right-0 z-0 mb-0 h-[280px] max-h-[280px] opacity-0"
              )}
              allow="clipboard-read; clipboard-write; autoplay"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
