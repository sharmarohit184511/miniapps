import Link from "next/link";
import { MiniAppCard } from "@/components/dashboard/MiniAppCard";
import { MINI_APPS } from "@/data/mini-apps";

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight md:text-3xl">
        My Mini Apps
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Start with{" "}
        <strong className="font-medium text-foreground">AI News Briefing</strong>{" "}
        for the full journey: Figma employee home (widget embedded) →{" "}
        <span className="text-foreground">Open full app</span> in the header.{" "}
        <Link
          href="/dashboard/ai-news-briefing"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Jump to Figma journey
        </Link>
        .
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MINI_APPS.map((app) => (
          <MiniAppCard key={app.id} {...app} />
        ))}
      </div>
    </div>
  );
}
