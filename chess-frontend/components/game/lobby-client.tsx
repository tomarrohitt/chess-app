"use client";
import { useSocket } from "@/store/socket-provider";
import { User } from "@/types/auth";
import { Zap, Flame, Clock, Timer } from "lucide-react";

const TIME_CONTROLS = [
  {
    category: "Bullet",
    icon: Zap,
    color: "text-yellow-400",
    border: "border-yellow-900/50",
    options: [{ label: "1+0", value: "1+0" }, { label: "2+1", value: "2+1" }, { label: "3+0", value: "3+0" }],
  },
  {
    category: "Blitz",
    icon: Flame,
    color: "text-orange-400",
    border: "border-orange-900/50",
    options: [{ label: "3+2", value: "3+2" }, { label: "5+0", value: "5+0" }, { label: "5+3", value: "5+3" }],
  },
  {
    category: "Rapid",
    icon: Clock,
    color: "text-green-400",
    border: "border-green-900/50",
    options: [{ label: "10+0", value: "10+0" }, { label: "10+5", value: "10+5" }, { label: "15+10", value: "15+10" }],
  },
  {
    category: "Classical",
    icon: Timer,
    color: "text-blue-400",
    border: "border-blue-900/50",
    options: [{ label: "30+0", value: "30+0" }, { label: "30+20", value: "30+20" }],
  },
];

export function LobbyClient({ user }: { user: User }) {
  const { joinQueue } = useSocket();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl select-none">♟</span>
          <span className="font-bold text-lg tracking-tight">Chess</span>
        </div>
        <div className="text-sm text-gray-800 font-semibold">
          Playing as{" "}
          <span className="text-gray-800 font-semibold">{user.username}</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-3xl">
          <h1 className="text-3xl font-bold text-center mb-1">Play Chess</h1>
          <p className="text-zinc-500 text-center text-sm mb-10">Choose a time control to find a match</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TIME_CONTROLS.map(({ category, icon: Icon, color, border, options }) => (
              <div
                key={category}
                className={`bg-zinc-900 border ${border} rounded-xl p-4`}
              >
                <div className={`flex items-center gap-1.5 mb-3 ${color}`}>
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold uppercase tracking-widest">{category}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => joinQueue(opt.value)}
                      className="w-full py-2.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-500 text-white font-mono font-semibold text-sm transition-all duration-100 hover:scale-[1.02] active:scale-[0.97]"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}