import { ReactNode } from "react";
import { BottomTabBar } from "./BottomTabBar";

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-background flex items-stretch md:items-start justify-center md:py-8">
      <div className="relative w-full md:w-[420px] md:rounded-[36px] md:ring-1 md:ring-black/10 md:shadow-2xl md:shadow-black/10 bg-surface overflow-hidden md:h-[860px] flex flex-col">
        <div className="flex-1 overflow-y-auto pb-24">{children}</div>
        <BottomTabBar />
      </div>
    </div>
  );
}
