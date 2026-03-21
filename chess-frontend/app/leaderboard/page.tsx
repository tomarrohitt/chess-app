import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Player = {
  player_id: number;
  username: string;
  name?: string;
  title?: string;
  score: number;
  rank: number;
  avatar?: string;
  win_count: number;
  loss_count: number;
  draw_count: number;
  url: string;
};

type LeaderboardsResponse = {
  live_blitz: Player[];
  live_rapid: Player[];
  live_bullet: Player[];
  daily: Player[];
};

const TABS: { id: keyof LeaderboardsResponse; label: string; icon: string }[] =
  [
    { id: "live_blitz", label: "Blitz", icon: "⚡" },
    { id: "live_rapid", label: "Rapid", icon: "♟" },
    { id: "live_bullet", label: "Bullet", icon: "🔥" },
    { id: "daily", label: "Daily", icon: "🏛" },
  ];

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-400/20 text-amber-400 text-base font-black border border-amber-400/40 shadow-sm shadow-amber-400/20">
        🥇
      </span>
    );
  if (rank === 2)
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-zinc-300/10 text-zinc-300 text-base font-black border border-zinc-400/30">
        🥈
      </span>
    );
  if (rank === 3)
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-700/15 text-orange-400 text-base font-black border border-orange-600/30">
        🥉
      </span>
    );
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 text-zinc-500 font-mono text-sm tabular-nums">
      {rank}
    </span>
  );
}

function WinRate({
  wins,
  draws,
  losses,
}: {
  wins: number;
  draws: number;
  losses: number;
}) {
  const total = wins + draws + losses;
  if (total === 0) return <span className="text-zinc-600 text-sm">—</span>;
  const pct = Math.round((wins / total) * 100);
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1.5 text-sm font-mono">
        <span className="text-emerald-400">{wins}</span>
        <span className="text-zinc-700">/</span>
        <span className="text-zinc-400">{draws}</span>
        <span className="text-zinc-700">/</span>
        <span className="text-rose-400">{losses}</span>
      </div>
      <div className="h-1 w-24 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-linear-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const LeaderBoardPage = async ({ searchParams }: { searchParams?: any }) => {
  const params = await Promise.resolve(searchParams);
  const activeTab = (params?.tab as keyof LeaderboardsResponse) || "live_blitz";

  const leaderboardData = await fetch(
    "https://api.chess.com/pub/leaderboards",
    { next: { revalidate: 3600 } },
  );
  const data: LeaderboardsResponse = await leaderboardData.json();
  const topPlayers = data[activeTab]?.slice(0, 50) || [];
  const activeTabMeta = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl w-8 text-center">
              {activeTabMeta.icon}
            </span>
            <div className="w-48 sm:w-56">
              <h1 className="text-lg font-black tracking-tight leading-none text-zinc-100">
                {activeTabMeta.label} Leaderboard
              </h1>
              <p className="text-[11px] text-zinc-600 mt-0.5 tracking-wide uppercase">
                Top 50 · Chess.com
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 space-y-5">
        <div className="inline-flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl gap-1 overflow-x-auto max-w-full">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={`/leaderboard?tab=${tab.id}`}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm transition-all ${
                  isActive
                    ? "bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20 font-bold"
                    : "text-zinc-400 hover:text-amber-50 hover:bg-zinc-800/50"
                }`}
              >
                <span className="mr-1.5">{tab.icon}</span>
                {tab.label}
              </Link>
            );
          })}
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden shadow-2xl shadow-black/40">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 bg-zinc-950/60 hover:bg-zinc-950/60">
                <TableHead className="w-14 text-center text-zinc-600 text-[11px] uppercase tracking-widest font-semibold">
                  #
                </TableHead>
                <TableHead className="text-zinc-600 text-[11px] uppercase tracking-widest font-semibold">
                  Player
                </TableHead>
                <TableHead className="text-right text-zinc-600 text-[11px] uppercase tracking-widest font-semibold">
                  Rating
                </TableHead>
                <TableHead className="text-right text-zinc-600 text-[11px] uppercase tracking-widest font-semibold hidden sm:table-cell">
                  W / D / L
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topPlayers.map((player, index) => (
                <TableRow
                  key={player.player_id}
                  className={`border-zinc-800/50 transition-colors group
                    ${index < 3 ? "bg-zinc-800/20" : ""}
                    hover:bg-zinc-800/40`}
                >
                  {/* Rank */}
                  <TableCell className="text-center py-3">
                    <RankBadge rank={player.rank} />
                  </TableCell>

                  {/* Player */}
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9 rounded-full ring-1 ring-zinc-700/60">
                        <AvatarImage
                          src={player.avatar}
                          alt={player.username}
                          className="object-cover"
                        />
                        <AvatarFallback className="rounded-full bg-zinc-800 text-zinc-400 text-xs font-bold">
                          {player.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {player.title && (
                            <Badge
                              variant="outline"
                              className="border-amber-600/50 bg-amber-500/10 text-amber-400 text-[10px] font-black tracking-wider px-1.5 py-0 h-4 rounded-sm"
                            >
                              {player.title}
                            </Badge>
                          )}
                          <a
                            href={player.url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-zinc-200 text-sm group-hover:text-amber-400 transition-colors truncate"
                          >
                            {player.username}
                          </a>
                        </div>
                        {player.name && (
                          <span className="text-[11px] text-zinc-600 truncate">
                            {player.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Rating */}
                  <TableCell className="text-right py-3">
                    <span
                      className={`font-mono font-black text-lg tabular-nums
                      ${player.rank === 1 ? "text-amber-400" : player.rank <= 3 ? "text-amber-500/80" : "text-zinc-200"}`}
                    >
                      {player.score.toLocaleString()}
                    </span>
                  </TableCell>

                  <TableCell className="text-right py-3 hidden sm:table-cell">
                    <WinRate
                      wins={player.win_count}
                      draws={player.draw_count}
                      losses={player.loss_count}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <p className="text-center text-[11px] text-zinc-700 pb-4">
          Data refreshes every hour · Source: Chess.com Public API
        </p>
      </div>
    </div>
  );
};

export default LeaderBoardPage;
