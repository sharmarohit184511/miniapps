"use client";

import {
  CalendarDays,
  GraduationCap,
  Grid3X3,
  Home,
} from "lucide-react";

export function FigmaBottomNav() {
  return (
    <nav
      className="flex h-[76px] items-start justify-around border-t border-[#e5f1f7] bg-white px-2 pt-2 pb-[env(safe-area-inset-bottom)]"
      aria-label="Main"
    >
      {[
        { icon: Home, label: "Home", active: true },
        { icon: CalendarDays, label: "Attendance" },
        { icon: GraduationCap, label: "Learn" },
        { icon: Grid3X3, label: "More" },
      ].map(({ icon: Icon, label, active }) => (
        <button
          key={label}
          type="button"
          className={`flex flex-col items-center gap-1 rounded-lg px-3 py-1 ${
            active ? "text-[#013e7c]" : "text-black/45"
          }`}
        >
          <Icon
            className={`size-6 ${active ? "stroke-[2.5px]" : ""}`}
            strokeWidth={active ? 2.5 : 1.8}
          />
          <span className="text-[10px] font-semibold">{label}</span>
        </button>
      ))}
    </nav>
  );
}
