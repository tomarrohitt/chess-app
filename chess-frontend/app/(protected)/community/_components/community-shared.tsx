import { Check, Search, Swords, Trophy, UserPlus, UserX } from "lucide-react";
import { getInitials } from "@/lib/constants/get-initials";
import { GetFriend, SearchFriend } from "@/types/friends";

export function getAvatarHue(name: string) {
  return [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
}

export function winRate(w: number, l: number, d: number) {
  const t = w + l + d;
  return t === 0 ? 0 : Math.round((w / t) * 100);
}

export function Avatar({
  player,
  size = 40,
}: {
  player: {
    name: string;
    image: string | null;
  };
  size?: number;
}) {
  const hue = getAvatarHue(player.name);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="rounded-full flex items-center justify-center font-bold text-xs"
        style={{
          width: size,
          height: size,
          background: player.image ? undefined : `hsl(${hue},45%,32%)`,
          color: `hsl(${hue},80%,82%)`,
          fontFamily: "'Fira Code', monospace",
          overflow: "hidden",
        }}
      >
        {player.image ? (
          <img
            src={player.image}
            alt={player.name}
            className="w-full h-full object-cover"
          />
        ) : (
          getInitials(player.name)
        )}
      </div>
      {/* {player.online !== undefined && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2"
          style={{
            width: size * 0.28,
            height: size * 0.28,
            background: player.online ? "#22c55e" : "#52525b",
            borderColor: "#0d0d10",
          }}
        />
      )} */}
    </div>
  );
}

export function StatBar({
  wins,
  losses,
  draws,
}: {
  wins: number;
  losses: number;
  draws: number;
}) {
  const t = wins + losses + draws || 1;
  return (
    <div className="flex gap-0.5 h-1 w-full rounded-full overflow-hidden">
      <div style={{ width: `${(wins / t) * 100}%`, background: "#22c55e" }} />
      <div style={{ width: `${(draws / t) * 100}%`, background: "#eab308" }} />
      <div style={{ width: `${(losses / t) * 100}%`, background: "#ef4444" }} />
    </div>
  );
}

export function FriendCard({
  player,
  actions,
}: {
  player: GetFriend;
  actions: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl group transition-all duration-150"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <Avatar
        player={{
          name: player.name,
          image: player.image,
        }}
        size={44}
      />

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <span
            className="text-sm font-semibold text-white truncate"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {player.name}
          </span>
          <span
            className="text-[11px] text-zinc-500 truncate"
            style={{ fontFamily: "'Fira Code', monospace" }}
          >
            @{player.username}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Trophy size={10} className="text-amber-400" />
            <span
              className="text-xs font-bold text-amber-400"
              style={{ fontFamily: "'Fira Code', monospace" }}
            >
              {player.rating}
            </span>
          </div>
          <span className="text-zinc-700 text-xs">·</span>
          <span
            className="text-[11px] text-zinc-500"
            style={{ fontFamily: "'Fira Code', monospace" }}
          >
            {winRate(player.wins, player.losses, player.draws)}% WR
          </span>
        </div>
        <StatBar
          wins={player.wins}
          losses={player.losses}
          draws={player.draws}
        />
      </div>

      <div className="flex items-center gap-1.5 shrink-0">{actions}</div>
    </div>
  );
}
export function PlayerCard({ player }: { player: SearchFriend }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl group transition-all duration-150"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <Avatar
        player={{
          name: player.name,
          image: player.image,
        }}
        size={44}
      />

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <span
            className="text-sm font-semibold text-white truncate"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {player.name}
          </span>
          <span
            className="text-[11px] text-zinc-500 truncate"
            style={{ fontFamily: "'Fira Code', monospace" }}
          >
            @{player.username}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Trophy size={10} className="text-amber-400" />
            <span
              className="text-xs font-bold text-amber-400"
              style={{ fontFamily: "'Fira Code', monospace" }}
            >
              {player.rating}
            </span>
          </div>
          <span className="text-zinc-700 text-xs">·</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <IconBtn icon={Swords} label="Challenge to game" variant="amber" />
        <IconBtn icon={UserPlus} label="Send friend request" variant="green" />
        <IconBtn icon={UserX} label="Block user" variant="red" />
      </div>
    </div>
  );
}

export function IconBtn({
  icon: Icon,
  label,
  variant = "default",
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  variant?: "default" | "green" | "red" | "amber";
}) {
  const colors = {
    default: {
      bg: "rgba(255,255,255,0.07)",
      hover: "rgba(255,255,255,0.13)",
      color: "#a1a1aa",
    },
    green: {
      bg: "rgba(34,197,94,0.12)",
      hover: "rgba(34,197,94,0.22)",
      color: "#4ade80",
    },
    red: {
      bg: "rgba(239,68,68,0.1)",
      hover: "rgba(239,68,68,0.2)",
      color: "#f87171",
    },
    amber: {
      bg: "rgba(234,179,8,0.1)",
      hover: "rgba(234,179,8,0.2)",
      color: "#fbbf24",
    },
  }[variant];

  return (
    <button
      title={label}
      className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150"
      style={{
        background: false ? colors.hover : colors.bg,
        color: colors.color,
      }}
    >
      <Icon size={14} />
    </button>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  sub,
}: {
  icon: React.ElementType;
  title: string;
  sub: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-16">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: "rgba(255,255,255,0.04)" }}
      >
        <Icon size={24} className="text-zinc-600" />
      </div>
      <p
        className="text-sm font-semibold text-zinc-400"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {title}
      </p>
      <p className="text-xs text-zinc-600 text-center max-w-55">{sub}</p>
    </div>
  );
}
