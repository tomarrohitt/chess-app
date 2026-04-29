import Link from "next/link";
import { GameStatus } from "@/types/chess";
import { cn, scrollClass } from "@/lib/utils";

export type Player = {
  id: string;
  username: string;
  currentRating: number;
  matchRating: number;
  diff: number;
};

export type GameRecord = {
  id: string;
  status: GameStatus;
  timeControl: string;
  createdAt: string;
  winnerId: string | null;
  result: string;
  finalFen: string;
  white: Player;
  black: Player;
};

function formatStatus(status: GameStatus) {
  switch (status) {
    case GameStatus.RESIGN:
      return "Resign";
    case GameStatus.TIME_OUT:
      return "Timeout";
    case GameStatus.AGREEMENT:
      return "Agreement";
    case GameStatus.CHECKMATE:
      return "Checkmate";
    case GameStatus.ABANDONED:
      return "Abandoned";
    case GameStatus.STALEMATE:
      return "Stalemate";
    default:
      return status.charAt(0) + status.slice(1).toLowerCase();
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function GameHistory({
  games,
  currentUserId,
}: {
  games: GameRecord[] | null;
  currentUserId: string;
}) {
  if (!games || games.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-8 text-center text-xs text-zinc-600 tracking-widest uppercase">
        No recent games
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center justify-between mb-5 px-1">
        <div>
          <p className="font-mono text-xs font-semibold text-amber-600/70 tracking-[0.18em] uppercase mb-1">
            Game history
          </p>
          <h2 className="font-serif text-xl font-light text-zinc-100 tracking-tight leading-none">
            Recent games
          </h2>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="font-mono text-lg font-medium text-zinc-200 leading-none">
            {games.length}
          </span>
          <span className="font-mono text-[10px] text-zinc-700 tracking-[0.14em] uppercase font-semibold">
            played
          </span>
        </div>
      </div>

      <div
        className={cn(
          "w-fullflex flex-col gap-0.5 overflow-y-auto max-h-[calc(100vh-160px)]",
          scrollClass,
        )}
      >
        {games.map((game) => {
          const isWhite = game.white.id === currentUserId;
          const isBlack = game.black.id === currentUserId;
          const isPlayer = isWhite || isBlack;

          const won = game.winnerId === currentUserId;
          const draw = game.result === "d";
          const lost = isPlayer && !won && !draw;
          const abandoned = game.status === GameStatus.ABANDONED;

          const opponent = isWhite ? game.black : game.white;
          const player = isWhite ? game.white : game.black;

          let pillClass = "bg-zinc-900 text-white border-zinc-800";
          let pillLabel = "—";

          if (abandoned) {
            pillClass = "bg-zinc-900/60 text-white border-zinc-800/40";
            pillLabel = "—";
          } else if (won) {
            pillClass =
              "bg-emerald-950/60 text-emerald-400 border-emerald-900/60";
            pillLabel = "W";
          } else if (lost) {
            pillClass = "bg-rose-950/60 text-rose-400 border-rose-900/60";
            pillLabel = "L";
          } else if (draw) {
            pillClass = "bg-zinc-900 text-white border-zinc-700/50";
            pillLabel = "D";
          }

          const diffColor =
            player.diff > 0
              ? "text-emerald-500"
              : player.diff < 0
                ? "text-rose-500"
                : "text-zinc-700";

          const diffLabel =
            player.diff > 0
              ? `+${player.diff}`
              : player.diff < 0
                ? `−${Math.abs(player.diff)}`
                : "±0";

          return (
            <Link
              key={game.id}
              href={`/game/${game.id}`}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-lg border border-transparent hover:bg-zinc-900/60 hover:border-zinc-800/60 transition-all duration-100"
            >
              <div
                className={`w-8 h-8 rounded-md flex items-center justify-center text-[10px] font-mono font-semibold tracking-wider border shrink-0 ${pillClass}`}
              >
                {pillLabel}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors truncate font-mono">
                  {opponent.username}
                  <span className="text-zinc-600 font-normal ml-1.5">
                    ({opponent.matchRating})
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-zinc-600 font-mono">
                    {game.timeControl}
                  </span>
                  <span className="w-0.5 h-0.5 rounded-full bg-zinc-800 shrink-0" />
                  <span className="text-[10px] text-zinc-600 font-mono">
                    {formatStatus(game.status)}
                  </span>
                  <span className="w-0.5 h-0.5 rounded-full bg-zinc-800 shrink-0" />
                  <span className="text-[10px] text-zinc-600 font-mono">
                    {formatDate(game.createdAt)}
                  </span>
                </div>
              </div>

              {isPlayer && (
                <div className="shrink-0 text-right">
                  <div className={`text-xs font-mono font-medium ${diffColor}`}>
                    {diffLabel}
                  </div>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
