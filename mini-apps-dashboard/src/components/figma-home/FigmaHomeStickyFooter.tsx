"use client";

import { AiNewsBriefingBottomWidget } from "./AiNewsBriefingBottomWidget";
import { FigmaBottomNav } from "./FigmaBottomNav";

type Props = {
  briefingUrl: string;
};

/** Light dock: Figma-style mini player + tab bar */
export function FigmaHomeStickyFooter({ briefingUrl }: Props) {
  return (
    <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-[360px] -translate-x-1/2 bg-white shadow-[0_-8px_32px_rgba(0,0,0,0.1)] ring-1 ring-black/[0.06]">
      <AiNewsBriefingBottomWidget briefingUrl={briefingUrl} />
      <FigmaBottomNav />
    </div>
  );
}
