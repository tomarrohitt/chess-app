import { Trophy } from "lucide-react";
import { getInitials } from "@/lib/constants/get-initials";
import { GetFriend } from "@/types/friends";
import { getWinRate } from "@/lib/chess-utils";
import Image from "next/image";
import Link from "next/link";

export function getAvatarHue(name: string) {
  return [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
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
          <Image
            src={player.image}
            alt={player.name}
            width={size}
            height={size}
            className="w-full h-full object-cover"
          />
        ) : (
          getInitials(player.name)
        )}
      </div>
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
          <Link href={`/profile/${player.id}`} className="underline">
            <span
              className="text-sm font-semibold text-white truncate"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {player.name}
            </span>
          </Link>
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
            {getWinRate(player.wins, player.losses, player.draws)}% WR
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

export function PlayerListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl animate-pulse"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            opacity: 1 - 0.19 * i,
          }}
        >
          <div className="w-11 h-11 rounded-full bg-zinc-800/60 shrink-0" />
          <div className="flex-1 min-w-0 flex flex-col gap-2.5">
            <div className="h-3.5 bg-zinc-800/80 rounded w-24" />
            <div className="h-2.5 bg-zinc-800/50 rounded w-16" />
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-zinc-800/60" />
            <div className="w-8 h-8 rounded-xl bg-zinc-800/60" />
            <div className="w-8 h-8 rounded-xl bg-zinc-800/60" />
          </div>
        </div>
      ))}
    </div>
  );
}
