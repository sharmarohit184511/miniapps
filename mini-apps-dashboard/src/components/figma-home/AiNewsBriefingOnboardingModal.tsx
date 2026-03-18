"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Headphones,
  Layers,
  Play,
  Sparkles,
  Volume2,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Modal width matches DiwaliHomeScreen + footer strip (`max-w-[360px]`). */

type Highlight = { Icon: LucideIcon; text: string };

type Slide = {
  kicker: string;
  title: string;
  lead: string;
  highlights: Highlight[];
  heroIcon: LucideIcon;
};

const SLIDES: Slide[] = [
  {
    kicker: "Smarter mornings",
    title: "News that listens to you",
    lead:
      "Turn today’s headlines into a natural two-host audio briefing—so you absorb what matters without living in the feed.",
    highlights: [
      { Icon: Layers, text: "Multi-topic digest in one flow" },
      { Icon: Clock, text: "Minutes, not endless scrolling" },
      { Icon: Sparkles, text: "Built for your daily home screen" },
    ],
    heroIcon: Sparkles,
  },
  {
    kicker: "Conversational audio",
    title: "Akshay & Kriti, on demand",
    lead:
      "Questions, context, and handoffs between sections—it feels like a short podcast written for the stories you care about.",
    highlights: [
      { Icon: Headphones, text: "Hands-free while you move" },
      { Icon: Volume2, text: "Clear pacing you can play or pause" },
      { Icon: Zap, text: "Energy that keeps you engaged" },
    ],
    heroIcon: Headphones,
  },
  {
    kicker: "Designed for real life",
    title: "Experience you’ll actually use",
    lead:
      "We optimized for glanceable summaries, one-tap playback, and listening when reading isn’t an option—commute, break, or between meetings.",
    highlights: [
      { Icon: Zap, text: "Faster path from headline to insight" },
      { Icon: Clock, text: "Respects your attention, not the algorithm" },
      { Icon: Play, text: "Pick a day, tap play—that’s it" },
    ],
    heroIcon: Zap,
  },
  {
    kicker: "You’re set",
    title: "Start in seconds",
    lead:
      "Scroll to News & Updates, hit play on any day, or open the full briefing app for history, topics, and deeper control.",
    highlights: [
      { Icon: Layers, text: "Written summaries expand on tap" },
      { Icon: Sparkles, text: "AI summaries when you want depth" },
      { Icon: Play, text: "Full app for power users" },
    ],
    heroIcon: Play,
  },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AiNewsBriefingOnboardingModal({ open, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const lastBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      setIndex(0);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      lastBtnRef.current?.focus();
    }
  }, [open, index]);

  const go = useCallback((dir: -1 | 1) => {
    setIndex((i) => {
      const n = i + dir;
      return Math.max(0, Math.min(SLIDES.length - 1, n));
    });
  }, []);

  if (!open) return null;

  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;
  const HeroIcon = slide.heroIcon;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center px-2 py-8 pt-16 sm:px-4 sm:py-10 sm:pt-20"
      style={{
        backgroundColor: "rgba(15, 40, 62, 0.38)",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
      }}
      aria-hidden={false}
    >
      <div className="w-full max-w-[360px] shrink-0 px-4 sm:px-5">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="relative w-full overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_20px_48px_-12px_rgba(1,62,124,0.2),0_0_0_1px_rgba(0,120,173,0.06)] sm:rounded-3xl"
        >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#0078ad]/[0.09] via-[#e8f4fc]/40 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-[#0078ad]/[0.06] blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-12 -left-12 size-40 rounded-full bg-[#013e7c]/[0.05] blur-2xl"
          aria-hidden
        />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex size-10 items-center justify-center rounded-full text-[#013e7c]/55 transition-all hover:bg-white/90 hover:text-[#013e7c] hover:shadow-sm"
          aria-label="Close"
        >
          <X className="size-5" strokeWidth={2} />
        </button>

        <div className="relative px-5 pb-6 pt-9 sm:px-6 sm:pb-7 sm:pt-10">
          <div className="mb-5 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 scale-110 rounded-2xl bg-gradient-to-br from-[#0078ad]/20 to-[#013e7c]/10 blur-md" />
              <span className="relative flex size-[4.5rem] items-center justify-center rounded-2xl bg-gradient-to-br from-[#e8f4fc] to-white text-[#0078ad] shadow-inner ring-1 ring-[#0078ad]/15">
                <HeroIcon className="size-9" strokeWidth={1.6} />
              </span>
            </div>
          </div>

          <p className="mb-1.5 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[#0078ad]">
            {slide.kicker}
          </p>
          <h2
            id={titleId}
            className="mb-3 text-center text-xl font-black leading-tight tracking-[-0.03em] text-[#141414] sm:text-[1.35rem]"
          >
            {slide.title}
          </h2>
          <p className="mb-6 text-center text-[13px] leading-relaxed text-black/60 sm:text-sm">
            {slide.lead}
          </p>

          <ul className="mb-8 space-y-2.5 rounded-2xl border border-[#e5f1f7]/90 bg-gradient-to-b from-[#f8fcfe] to-white/80 px-4 py-3.5 sm:px-5 sm:py-4">
            {slide.highlights.map(({ Icon, text }, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-left text-[13px] leading-snug text-[#1a3a52]/90"
              >
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#0078ad]/10 text-[#0078ad]">
                  <Icon className="size-4" strokeWidth={2} />
                </span>
                <span className="pt-1 font-medium">{text}</span>
              </li>
            ))}
          </ul>

          <div className="flex justify-center gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === index
                    ? "w-7 bg-[#0078ad] shadow-sm shadow-[#0078ad]/30"
                    : "w-1.5 bg-[#0078ad]/22 hover:bg-[#0078ad]/38"
                )}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index ? "step" : undefined}
              />
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between gap-2 border-t border-[#e5f1f7]/80 pt-5">
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={index === 0}
              className="inline-flex min-h-11 shrink-0 items-center gap-0.5 rounded-full border border-[#013e7c]/18 bg-white/80 px-3 py-2 text-[11px] font-bold text-[#013e7c] shadow-sm transition-all hover:border-[#013e7c]/28 hover:bg-[#f5fafd] disabled:pointer-events-none disabled:opacity-30 sm:gap-1 sm:px-4 sm:text-xs"
            >
              <ChevronLeft className="size-4" />
              Back
            </button>

            {isLast ? (
              <button
                ref={lastBtnRef}
                type="button"
                onClick={onClose}
                className="min-h-11 shrink-0 rounded-full bg-gradient-to-r from-[#0078ad] to-[#006a99] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#0078ad]/22 transition-all hover:from-[#006a99] hover:to-[#005a85] hover:shadow-[#0078ad]/28 sm:px-7 sm:text-sm"
              >
                Get started
              </button>
            ) : (
              <button
                ref={lastBtnRef}
                type="button"
                onClick={() => go(1)}
                className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-[#0078ad] to-[#006a99] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#0078ad]/22 transition-all hover:from-[#006a99] hover:to-[#005a85] sm:px-6 sm:text-sm"
              >
                Next
                <ChevronRight className="size-4" />
              </button>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
