"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  normalizeDialogueSpeaker,
  dialogueSpeakerLabel,
} from "@/lib/dialogue-speakers";

export type AudioTranscript = {
  headline?: string;
  bullets?: string[];
  /** Full script (e.g. Akshay: … / Kriti: …) */
  script?: string;
  dialogue?: { speaker: string; text: string }[];
};

type Props = {
  src: string;
  className?: string;
  /** Try to start playback when ready (may be blocked until user taps, esp. in iframes) */
  autoPlay?: boolean;
  /** Compact layout for Figma iframe */
  compact?: boolean;
  transcript?: AudioTranscript | null;
};

const SPEED_PRESETS = [0.75, 1, 1.25, 1.5] as const;

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayer({ src, className, autoPlay, compact, transcript }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  const applyPlaybackRate = useCallback((rate: number) => {
    const el = audioRef.current;
    if (el) el.playbackRate = rate;
    setPlaybackRateState(rate);
  }, []);

  const seekBy = useCallback((delta: number) => {
    const el = audioRef.current;
    if (!el || !Number.isFinite(el.duration)) return;
    const next = Math.max(0, Math.min(el.duration, el.currentTime + delta));
    el.currentTime = next;
    setCurrentTime(next);
  }, []);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTimeUpdate = () => setCurrentTime(el.currentTime);
    const onDurationChange = () => setDuration(el.duration);
    const onEnded = () => setPlaying(false);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const tryAutoplay = () => {
      if (autoPlay) el.play().catch(() => {});
    };
    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("durationchange", onDurationChange);
    el.addEventListener("ended", onEnded);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    if (autoPlay) {
      if (el.readyState >= 3) tryAutoplay();
      else el.addEventListener("canplay", tryAutoplay, { once: true });
    }
    return () => {
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("durationchange", onDurationChange);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("canplay", tryAutoplay);
    };
  }, [src, autoPlay]);

  useEffect(() => {
    const el = audioRef.current;
    if (el) el.playbackRate = playbackRate;
  }, [src, playbackRate]);

  const progress = duration > 0 && Number.isFinite(duration) ? (currentTime / duration) * 100 : 0;
  const hasTranscript =
    transcript &&
    (transcript.headline ||
      (transcript.bullets?.length ?? 0) > 0 ||
      (transcript.script?.trim() ?? "") ||
      (transcript.dialogue?.length ?? 0) > 0);

  const controlsRow = (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        compact ? "justify-center" : "sm:justify-start"
      )}
    >
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={cn(compact ? "h-8 px-2 text-xs" : "")}
        onClick={() => seekBy(-10)}
        disabled={!Number.isFinite(duration) || duration <= 0}
        aria-label="Back 10 seconds"
      >
        −10s
      </Button>
      <Button
        type="button"
        size={compact ? "sm" : "icon"}
        variant="outline"
        className={cn(compact ? "h-8 px-3" : "")}
        onClick={() => {
          const el = audioRef.current;
          if (!el) return;
          if (playing) {
            el.pause();
          } else {
            void el.play();
          }
        }}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? "⏸" : "▶"}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={cn(compact ? "h-8 px-2 text-xs" : "")}
        onClick={() => seekBy(10)}
        disabled={!Number.isFinite(duration) || duration <= 0}
        aria-label="Forward 10 seconds"
      >
        +10s
      </Button>
      <div
        className={cn(
          "flex flex-wrap items-center gap-1 border-l border-border pl-2",
          compact && "border-0 pl-0"
        )}
      >
        <span className={cn("text-muted-foreground", compact ? "text-[10px]" : "text-xs")}>
          Speed
        </span>
        {SPEED_PRESETS.map((r) => (
          <Button
            key={r}
            type="button"
            size="sm"
            variant={playbackRate === r ? "default" : "outline"}
            className={cn(compact ? "h-7 min-w-[2.25rem] px-1.5 text-[10px]" : "h-8 min-w-12 px-2")}
            onClick={() => applyPlaybackRate(r)}
          >
            {r === 1 ? "1×" : `${r}×`}
          </Button>
        ))}
      </div>
      {hasTranscript && (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className={cn(compact ? "h-8 text-xs" : "")}
          onClick={() => setTranscriptOpen(true)}
          aria-label="Show transcript"
        >
          Transcript
        </Button>
      )}
    </div>
  );

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <audio ref={audioRef} src={src} preload="metadata" />
      {controlsRow}
      <div className="flex flex-1 flex-col gap-2">
        <Progress
          value={progress}
          className="h-3 rounded-full [&_[data-slot=progress-track]]:rounded-full [&_[data-slot=progress-indicator]]:rounded-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(Number.isFinite(duration) ? duration : 0)}</span>
        </div>
      </div>

      {transcriptOpen && hasTranscript && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Transcript"
          onClick={() => setTranscriptOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border bg-card p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">Transcript</h3>
              <Button type="button" size="sm" variant="ghost" onClick={() => setTranscriptOpen(false)}>
                Close
              </Button>
            </div>
            {transcript.headline && (
              <p className="mb-3 text-base font-semibold leading-snug">{transcript.headline}</p>
            )}
            {transcript.bullets && transcript.bullets.length > 0 && (
              <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {transcript.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            )}
            {transcript.dialogue && transcript.dialogue.length > 0 ? (
              <div className="space-y-3 text-sm">
                {transcript.dialogue.map((t, i) => (
                  <p key={i}>
                    <span className="font-semibold capitalize text-primary">
                      {(() => {
                        const id = normalizeDialogueSpeaker(t.speaker);
                        return id ? dialogueSpeakerLabel(id) : t.speaker;
                      })()}
                      :{" "}
                    </span>
                    {t.text}
                  </p>
                ))}
              </div>
            ) : transcript.script ? (
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                {transcript.script}
              </pre>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
