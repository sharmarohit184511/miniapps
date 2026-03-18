"use client";

import { AiNewsBriefingBottomWidget } from "./AiNewsBriefingBottomWidget";
import { FigmaBottomNav } from "./FigmaBottomNav";
import { useFigmaBriefing } from "./FigmaBriefingContext";

type Props = {
  briefingUrl: string;
};

/** Bottom nav; mini player when playing above nav */
export function FigmaHomeStickyFooter({ briefingUrl }: Props) {
  const { playing } = useFigmaBriefing();

  return (
    <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-[360px] -translate-x-1/2 bg-white shadow-[0_-8px_32px_rgba(0,0,0,0.08)]">
      {playing ? (
        <AiNewsBriefingBottomWidget briefingUrl={briefingUrl} />
      ) : null}
      <FigmaBottomNav />
    </div>
  );
}
