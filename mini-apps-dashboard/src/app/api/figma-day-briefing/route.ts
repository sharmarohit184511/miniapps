import { NextRequest, NextResponse } from "next/server";
import { getBriefingApiBase } from "@/lib/briefing-api-base";

export async function POST(request: NextRequest) {
  let body: { date?: string; ttsProvider?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const base = getBriefingApiBase();
  try {
    const res = await fetch(`${base}/api/figma-day-briefing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: body.date,
        ttsProvider: body.ttsProvider,
      }),
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to reach briefing app" },
      { status: 502 }
    );
  }
}
