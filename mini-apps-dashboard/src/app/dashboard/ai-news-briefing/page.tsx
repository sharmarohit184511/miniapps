import { AiNewsBriefingJourneyShell } from "@/components/figma-home/AiNewsBriefingJourneyShell";

function getBriefingAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_AI_NEWS_BRIEFING_URL?.replace(/\/$/, "") ??
    "http://localhost:3001"
  );
}

export const metadata = {
  title: "AI News Briefing — Figma journey | Mini Apps",
  description:
    "Employee home Figma design with AI News Briefing widget; open the full app anytime.",
};

export default function AiNewsBriefingJourneyPage() {
  const briefingUrl = getBriefingAppUrl();
  return <AiNewsBriefingJourneyShell briefingUrl={briefingUrl} />;
}
