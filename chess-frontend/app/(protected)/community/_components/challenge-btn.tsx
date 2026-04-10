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
        <div className="absolute right-0 top-full mt-2 w-32 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50">
          <div className="p-1 flex flex-col">
            <span className="text-[10px] font-bold text-zinc-500 px-2 py-1.5 uppercase tracking-wider">
              Time Control
            </span>
            {TIME_CONTROLS.map((tc) => (
              <button
                key={tc}
                className="text-sm text-left px-2 py-1.5 text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-lg transition-colors cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  offerChallenge(targetId, tc);
                  setIsOpen(false);
                }}
              >
                {tc}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
