"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const POLL_MS = 1800;
const POLL_MAX = 100;
const FETCH_TIMEOUT_MS = 45_000;

function fetchWithTimeout(
  input: string,
  init?: RequestInit & { timeoutMs?: number }
): Promise<Response> {
  const timeoutMs = init?.timeoutMs ?? FETCH_TIMEOUT_MS;
  const { timeoutMs: _, ...rest } = init ?? {};
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  return fetch(input, { ...rest, signal: ctrl.signal }).finally(() =>
    clearTimeout(t)
  );
}

export function useFigmaDayBriefingPlayer() {
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [briefingErr, setBriefingErr] = useState<Record<string, string>>({});
  const [activeAudioDate, setActiveAudioDate] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const briefingInFlightRef = useRef<string | null>(null);
  /** Last successful audio URL per feed date — replay with one tap (user gesture). */
  const audioUrlByDateRef = useRef<Record<string, string>>({});
  /** Feed date for the current `audio` src (for correlating loadedmetadata). */
  const currentAudioDateRef = useRef<string | null>(null);
  const [audioDurationByDate, setAudioDurationByDate] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      setActiveAudioDate(null);
    };
    const onLoadedMetadata = () => {
      const date = currentAudioDateRef.current;
      const d = el.duration;
      if (
        date &&
        typeof d === "number" &&
        Number.isFinite(d) &&
        d > 0 &&
        !Number.isNaN(d)
      ) {
        setAudioDurationByDate((prev) => ({
          ...prev,
          [date]: Math.round(d),
        }));
      }
    };
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    el.addEventListener("loadedmetadata", onLoadedMetadata);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, []);

  const pollUntilAudio = useCallback(async (briefingId: string, date: string) => {
    for (let i = 0; i < POLL_MAX; i++) {
      await new Promise((r) => setTimeout(r, POLL_MS));
      let r: Response;
      try {
        r = await fetchWithTimeout(
          `/api/briefing-status/${encodeURIComponent(briefingId)}`,
          { cache: "no-store" }
        );
      } catch (e) {
        const msg =
          e instanceof Error && e.name === "AbortError"
            ? "Request timed out — check the briefing app is running."
            : "Network error while checking status.";
        setBriefingErr((prev) => ({ ...prev, [date]: msg }));
        return;
      }
      let d: Record<string, unknown>;
      try {
        d = (await r.json()) as Record<string, unknown>;
      } catch {
        setBriefingErr((prev) => ({
          ...prev,
          [date]: "Invalid response from briefing server.",
        }));
        return;
      }
      if (!r.ok) {
        const errMsg =
          typeof d.error === "string"
            ? d.error
            : r.status === 404
              ? "Briefing not found — try again."
              : `Briefing status error (${r.status})`;
        setBriefingErr((prev) => ({ ...prev, [date]: errMsg }));
        return;
      }
      if (d.status === "failed") {
        setBriefingErr((prev) => ({
          ...prev,
          [date]:
            typeof d.error === "string" ? d.error : "Briefing failed",
        }));
        return;
      }
      if (d.status === "completed" && typeof d.audio_url === "string" && d.audio_url) {
        const el = audioRef.current;
        if (el) {
          const url = d.audio_url;
          audioUrlByDateRef.current[date] = url;
          try {
            el.pause();
            currentAudioDateRef.current = date;
            el.src = url;
            setActiveAudioDate(date);
            await el.play();
          } catch (playErr) {
            const name =
              playErr && typeof playErr === "object" && "name" in playErr
                ? String((playErr as { name: string }).name)
                : "";
            if (name === "NotAllowedError") {
              setBriefingErr((prev) => ({
                ...prev,
                [date]:
                  "Ready — tap play again to listen (browser blocked auto-play).",
              }));
            } else {
              setBriefingErr((prev) => ({
                ...prev,
                [date]: "Could not start playback — tap play to try again.",
              }));
            }
          }
        }
        return;
      }
    }
    setBriefingErr((prev) => ({
      ...prev,
      [date]:
        "Still generating after several minutes. If you use Redis, run the briefing worker or set BRIEFING_FIGMA_DAY_USE_QUEUE=0 (default). Open the full briefing app to retry.",
    }));
  }, []);

  const startConversationBriefing = useCallback(
    async (date: string) => {
      if (briefingInFlightRef.current) {
        if (briefingInFlightRef.current !== date) return;
        return;
      }

      const el = audioRef.current;
      const cachedUrl = audioUrlByDateRef.current[date];

      if (activeAudioDate === date && playing) {
        el?.pause();
        return;
      }

      if (cachedUrl && el) {
        try {
          el.pause();
          currentAudioDateRef.current = date;
          el.src = cachedUrl;
          setActiveAudioDate(date);
          await el.play();
          setBriefingErr((prev) => ({ ...prev, [date]: "" }));
          return;
        } catch {
          setBriefingErr((prev) => ({
            ...prev,
            [date]: "Tap play again to listen.",
          }));
          return;
        }
      }

      if (
        activeAudioDate === date &&
        el &&
        el.src &&
        Number.isFinite(el.duration) &&
        el.duration > 0 &&
        el.currentTime > 0.5 &&
        el.currentTime < el.duration - 0.3
      ) {
        try {
          await el.play();
        } catch {
          /* ignore */
        }
        return;
      }

      setBriefingErr((prev) => ({ ...prev, [date]: "" }));
      briefingInFlightRef.current = date;
      try {
        const res = await fetchWithTimeout("/api/figma-day-briefing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date }),
          timeoutMs: 120_000,
        });
        const j = (await res.json()) as {
          error?: string;
          briefingId?: string;
          cached?: boolean;
          inProgress?: boolean;
          audio_url?: string;
        };
        if (!res.ok) {
          setBriefingErr((prev) => ({
            ...prev,
            [date]: typeof j.error === "string" ? j.error : "Could not start",
          }));
          return;
        }
        const id = j.briefingId;
        if (!id) {
          setBriefingErr((prev) => ({ ...prev, [date]: "No briefing id" }));
          return;
        }

        const directUrl =
          j.cached &&
          typeof j.audio_url === "string" &&
          j.audio_url.trim().length > 0
            ? j.audio_url.trim()
            : "";

        if (directUrl && el) {
          try {
            el.pause();
            currentAudioDateRef.current = date;
            el.src = directUrl;
            audioUrlByDateRef.current[date] = directUrl;
            setActiveAudioDate(date);
            setBriefingErr((prev) => ({ ...prev, [date]: "" }));
            await el.play();
          } catch (playErr) {
            const name =
              playErr && typeof playErr === "object" && "name" in playErr
                ? String((playErr as { name: string }).name)
                : "";
            if (name === "NotAllowedError") {
              setBriefingErr((prev) => ({
                ...prev,
                [date]:
                  "Ready — tap play again to listen (browser blocked auto-play).",
              }));
            } else {
              setBriefingErr((prev) => ({
                ...prev,
                [date]: "Could not start playback — tap play to try again.",
              }));
            }
          }
          return;
        }

        setGeneratingFor(date);
        await pollUntilAudio(id, date);
      } catch (e) {
        const msg =
          e instanceof Error && e.name === "AbortError"
            ? "Starting briefing timed out — check NEWS_API_KEY and server logs."
            : "Network error";
        setBriefingErr((prev) => ({
          ...prev,
          [date]: msg,
        }));
      } finally {
        briefingInFlightRef.current = null;
        setGeneratingFor(null);
      }
    },
    [activeAudioDate, playing, pollUntilAudio]
  );

  return {
    audioRef,
    generatingFor,
    briefingErr,
    activeAudioDate,
    playing,
    startConversationBriefing,
    audioDurationByDate,
  };
}
