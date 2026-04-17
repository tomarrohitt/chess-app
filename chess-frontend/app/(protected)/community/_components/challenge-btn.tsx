"use client";

import { useSocket } from "@/store/socket-provider";
import { IconBtn } from "./icon-btn";
import { Swords } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const TIME_CONTROLS = ["1+0", "3+0", "5+0", "10+0", "15+10", "30+0"];

export function ChallengeButton({ targetId }: { targetId: string }) {
  const { offerChallenge } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <IconBtn
        icon={<Swords size="14" />}
        label="Challenge"
        variant="amber"
        onClick={async () => {
          setIsOpen((prev) => !prev);
          return true;
        }}
      />
      {isOpen && (
        <div
          className="
      absolute right-0 top-full mt-2 w-40
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
              group flex items-center justify-between
              text-sm px-3 py-2
              text-zinc-300
              rounded-xl
              transition-all duration-150

              hover:bg-zinc-800 hover:text-white
              active:scale-[0.97] cursor-pointer
            "
                  onClick={(e) => {
                    e.stopPropagation();
                    offerChallenge(targetId, tc);
                    setIsOpen(false);
                  }}
                >
                  <span>{tc}</span>

                  <span className="opacity-0 group-hover:opacity-100 text-xs text-zinc-500">
                    →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
