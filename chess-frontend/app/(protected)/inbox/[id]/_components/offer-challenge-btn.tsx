"use client";

import { useSocket } from "@/store/socket-provider";
import { Swords } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const TIME_CONTROLS = ["1+0", "3+0", "5+0", "10+0", "15+10", "30+0"];

export const OfferChallengeBtn = ({ id }: { id: string }) => {
  const { offerChallenge } = useSocket();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <div className="relative w-full" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        suppressHydrationWarning={true}
        className="
          flex items-center gap-3 p-3 rounded-xl
          hover:bg-white/5 active:scale-[0.98]
          transition-all
          text-zinc-300 text-sm font-medium w-full text-left
        "
      >
        <Swords size={16} className="text-amber-400" />
        <span>Challenge</span>

        <span className="ml-auto text-xs text-zinc-500">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div
          className="
            absolute left-0 mt-2 w-full
            bg-zinc-900/95 backdrop-blur-md
            border border-zinc-800
            rounded-2xl shadow-2xl
            overflow-hidden z-50
            animate-in fade-in zoom-in-95 duration-100
          "
        >
          <div className="p-2">
            <span className="block text-[10px] font-semibold text-zinc-500 px-2 pb-2 uppercase tracking-wider">
              Time Control
            </span>

            <div className="flex flex-col gap-1">
              {TIME_CONTROLS.map((tc) => (
                <button
                  key={tc}
                  className="
                    flex items-center justify-between
                    px-3 py-2 text-sm
                    text-zinc-300 rounded-xl
                    hover:bg-zinc-800 hover:text-white
                    active:scale-[0.97]
                    transition-all cursor-pointer
                  "
                  onClick={(e) => {
                    e.stopPropagation();
                    offerChallenge(id, tc);
                    setOpen(false);
                  }}
                >
                  {tc}
                  <span className="text-xs text-zinc-500">→</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
