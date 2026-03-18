"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

type Props = {
  briefingUrl: string;
};

export function AiNewsBriefingLaunch({ briefingUrl }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <a
          href={briefingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ size: "lg" }),
            "inline-flex gap-2 rounded-full px-6"
          )}
        >
          <ExternalLink className="size-4" />
          Open in new tab
        </a>
        <p className="w-full text-sm text-muted-foreground sm:w-auto sm:self-center">
          Or use the embedded app below (run the briefing server on the URL in{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.local</code>).
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border bg-muted/30 shadow-inner">
        <iframe
          title="AI News Briefing"
          src={briefingUrl}
          className="h-[min(85dvh,720px)] w-full bg-background"
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </div>
  );
}
