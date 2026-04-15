"use client";

import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

export const ShowInfoBtn = () => {
  return (
    <button
      // onClick={() => setShowInfo((prev) => !prev)}
      className={cn(
        "w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer",
        // showInfo
        //   ? "bg-white/10 text-white"
        //   : "text-zinc-400 hover:bg-white/5 hover:text-white",
      )}
    >
      <Info size={18} />
    </button>
  );
};
