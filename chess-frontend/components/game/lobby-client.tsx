import { Zap, Flame, Clock, Timer } from "lucide-react";
import JoinButton from "./join-button";

const TIME_CONTROLS = [
  {
    category: "Bullet",
    icon: Zap,
    accentClass: "text-amber-400",
    dotClass: "bg-amber-400/20 text-amber-400",
    options: [
      { label: "1 + 0", value: "1+0" },
      { label: "2 + 1", value: "2+1" },
      { label: "3 + 0", value: "3+0" },
    ],
  },
  {
    category: "Blitz",
    icon: Flame,
    accentClass: "text-orange-400",
    dotClass: "bg-orange-400/20 text-orange-400",
    options: [
      { label: "3 + 2", value: "3+2" },
      { label: "5 + 0", value: "5+0" },
      { label: "5 + 3", value: "5+3" },
    ],
  },
  {
    category: "Rapid",
    icon: Clock,
    accentClass: "text-emerald-400",
    dotClass: "bg-emerald-400/20 text-emerald-400",
    options: [
      { label: "10 + 0", value: "10+0" },
      { label: "10 + 5", value: "10+5" },
      { label: "15 + 10", value: "15+10" },
    ],
  },
  {
    category: "Classical",
    icon: Timer,
    accentClass: "text-sky-400",
    dotClass: "bg-sky-400/20 text-sky-400",
    options: [
      { label: "30 + 0", value: "30+0" },
      { label: "30 + 20", value: "30+20" },
    ],
  },
];

export function LobbyClient() {
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-10">
          <p className="font-mono text-xs tracking-[0.18em] text-amber-500/80 uppercase mb-2">
            Find a game
          </p>
          <h1 className="font-serif text-5xl font-light text-zinc-100 tracking-tight mb-2">
            Play Chess
          </h1>
          <p className="font-mono text-sm text-zinc-600 tracking-wide">
            Choose your time control
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {TIME_CONTROLS.map(
            ({ category, icon: Icon, accentClass, dotClass, options }) => (
              <div
                key={category}
                className="bg-zinc-900/80 border border-zinc-800/60 rounded-xl p-5 hover:border-zinc-700/60 transition-colors duration-150"
              >
                <div
                  className={`flex items-center gap-2.5 mb-4 ${accentClass}`}
                >
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center ${dotClass}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-xs font-semibold tracking-[0.14em] uppercase">
                    {category}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {options.map((opt) => (
                    <JoinButton
                      key={opt.value}
                      label={opt.label}
                      value={opt.value}
                    />
                  ))}
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
