import { NextRequest, NextResponse } from "next/server";
import { getBriefingApiBase } from "@/lib/briefing-api-base";

function absoluteAudioUrl(
  base: string,
  audioUrl: string | null | undefined
): string | null {
  if (!audioUrl || typeof audioUrl !== "string") return null;
  if (/^https?:\/\//i.test(audioUrl)) return audioUrl;
  return `${base}${audioUrl.startsWith("/") ? "" : "/"}${audioUrl}`;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Missing briefing id" }, { status: 400 });
  }
  const base = getBriefingApiBase();
  try {
    const res = await fetch(`${base}/api/briefings/${encodeURIComponent(id)}?t=${Date.now()}`, {
      cache: "no-store",
    });
    const data = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    const audio_url = absoluteAudioUrl(base, data.audio_url as string | undefined);
    return NextResponse.json(
      { ...data, audio_url },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to reach briefing app" },
      { status: 502 }
    );
  }
}
