import { AiNewsBriefingJourneyShell } from "@/components/figma-home/AiNewsBriefingJourneyShell";

function getBriefingAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_AI_NEWS_BRIEFING_URL?.replace(/\/$/, "") ??
    "http://localhost:3001"
  );
}

export const metadata = {
  title: "Home | Mini Apps",
  description:
    "Employee home with AI News Briefing; open the full app anytime.",
};

export default function HomePage() {
  const briefingUrl = getBriefingAppUrl();
  return (
    <div className="min-h-dvh bg-[#f0f4f8]">
      <AiNewsBriefingJourneyShell briefingUrl={briefingUrl} />
    </div>
  );
}
