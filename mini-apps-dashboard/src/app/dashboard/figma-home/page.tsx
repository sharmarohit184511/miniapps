import { permanentRedirect } from "next/navigation";

/** Same journey as AI News Briefing card — one canonical URL */
export default function FigmaHomeRedirectPage() {
  permanentRedirect("/dashboard/ai-news-briefing");
}
