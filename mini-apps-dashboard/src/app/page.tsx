import { AiNewsBriefingJourneyShell } from "@/components/figma-home/AiNewsBriefingJourneyShell";
import { getBriefingAppUrl } from "@/lib/briefing-public-url";

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
