import { getUserFromSession } from "@/actions/session";
import { GameRecord } from "@/types/history";
import { GameStatus } from "@/types/chess";
import { Swords } from "lucide-react";
import Link from "next/link";
import { cn, scrollClass } from "@/lib/utils";
import { GameboardSnapshot } from "@/app/(protected)/profile/[id]/_components/gameboard-snapshot";
import {
  avgMoveTime,
  formatDate,
  formatStatus,
  getMaterialAdvantage,
  PIECE_GLYPHS,
} from "@/lib/chess-utils";
import { safeFetch } from "@/lib/constants/safe-fetch";

async function getRecentGames(id: string): Promise<GameRecord[] | null> {
  try {
    const res = safeFetch<GameRecord[]>(`/games/history/${id}?limit=20`);
    return res;
  } catch {
    return null;
  }
}

export async function RecentGames({ id }: { id: string }) {
  const [games, user] = await Promise.all([
    getRecentGames(id),
    getUserFromSession(),
  ]);

  if (!games || !user) {
    return (
      <div className="bg-[#141414] border border-[#242424] rounded-[14px] py-5.5 px-6 mt-4">
        <div className="flex items-center gap-2 mb-4">
          <Swords size={15} color="#4ade80" />
          <span className="text-[14px] font-semibold text-[#e5e5e5]">
            Recent Games
          </span>
        </div>
        <p className="text-[12px] text-[#3d3d3d] font-mono text-center py-4 uppercase tracking-widest">
          No games yet
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#141414] border border-[#242424] rounded-[14px] backdrop-blur-sm py-5.5 px-6 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <Swords size={15} color="#4ade80" />
        <span className="text-[14px] font-semibold text-[#e5e5e5]">
          Recent Games
        </span>
      </div>

      <div
        className={cn(
          "flex flex-col gap-3 overflow-y-auto max-h-150 pr-2",
          scrollClass,
        )}
      >
        {games.map((game) => {
          const isWhite = game.white.id === user.id;
          const won = game.winnerId === user.id;
          const draw = game.result === "d";
          const abandoned = game.status === GameStatus.ABANDONED;
          const lost = !won && !draw && !abandoned;

          const opponent = isWhite ? game.black : game.white;
          const player = isWhite ? game.white : game.black;

          const mat = getMaterialAdvantage(game.finalFen);
          const moveCount = game.moveTimes.length;
          const avg = avgMoveTime(game.moveTimes);

          const myMatDiff = isWhite ? mat.diff : -mat.diff;
          const myCaptured = isWhite
            ? mat.capturedByWhite
            : mat.capturedByBlack;

          const ratingGap = opponent.matchRating - player.matchRating;

          const badgeStyle = abandoned
            ? "bg-[#1f1f1f] text-[#a3a3a3] border-[#333333]"
            : won
              ? "bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]/20"
              : lost
                ? "bg-[#f87171]/10 text-[#f87171] border-[#f87171]/20"
                : "bg-[#2a2a2a] text-[#d4d4d4] border-[#404040]";

          const badgeLabel = abandoned
            ? "Abnd."
            : won
              ? "Won"
              : lost
                ? "Lost"
                : "Draw";

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
              className="group flex items-stretch bg-[#0c0c0c] border border-[#242424] rounded-lg overflow-hidden hover:border-[#3d3d3d] transition-all duration-100 shrink-0"
            >
              <div className="shrink-0 flex flex-col">
                <div style={{ width: 164, height: 164 }}>
                  <GameboardSnapshot game={game} isWhite={isWhite} />
                  <MaterialBar diff={mat.diff} />
                </div>
              </div>

              <div className="flex flex-col flex-1 min-w-0 px-4 py-3 gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-mono text-[10px] text-[#737373] uppercase tracking-widest mb-0.5">
                      vs
                    </div>
                    <div className="font-serif text-lg font-medium text-[#e5e5e5] group-hover:text-white transition-colors truncate">
                      {opponent.username}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-xs text-[#a3a3a3]">
                        {opponent.matchRating}
                      </span>
                      {ratingGap !== 0 && (
                        <span
                          className={`font-mono text-[10px] font-semibold px-1.5 py-px rounded-sm ${
                            ratingGap > 0
                              ? "bg-[#d97706]/10 text-[#d97706]"
                              : "bg-[#242424] text-[#737373]"
                          }`}
                        >
                          {ratingGap > 0 ? `+${ratingGap}` : ratingGap} rated
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`font-mono text-[10px] font-semibold tracking-wider px-2 py-1 rounded shrink-0 uppercase border ${badgeStyle}`}
                  >
                    {badgeLabel}
                  </span>
                </div>

                <div className="flex bg-[#050505] rounded-md overflow-hidden border border-[#1a1a1a] mt-1">
                  <StatPill label="Moves" value={String(moveCount)} />
                  <StatPill
                    label="Avg"
                    value={avg !== null ? `${avg}s` : "—"}
                  />
                  <StatPill label="Rating" value={String(player.matchRating)} />
                  <StatPill label="Change" value={diffLabel} />
                </div>

                <div className="flex items-center gap-2 min-h-4 mt-2">
                  {myMatDiff > 0 ? (
                    <>
                      <span className="font-mono text-xs text-[#d97706] uppercase tracking-wider font-semibold">
                        +{myMatDiff}
                      </span>
                      <PiecesDisplay captured={myCaptured} />
                    </>
                  ) : myMatDiff < 0 ? (
                    <span className="font-mono text-xs text-[#a3a3a3] uppercase tracking-wider">
                      −{Math.abs(myMatDiff)} material
                    </span>
                  ) : (
                    <span className="font-mono text-xs text-[#737373] uppercase tracking-wider">
                      Equal material
                    </span>
                  )}
                </div>

                {/* Row 4: meta footer */}
                <div className="flex items-center justify-between mt-auto pt-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[#a3a3a3]">
                      {game.timeControl}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-[#333333]" />
                    <span className="font-mono text-xs text-[#a3a3a3]">
                      {formatStatus(game.status)}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-[#333333]" />
                    <span className="font-mono text-xs text-[#a3a3a3]">
                      {formatDate(game.createdAt)}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[#737373] uppercase tracking-wider font-semibold">
                    {isWhite ? "White" : "Black"}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function PiecesDisplay({ captured }: { captured: Record<string, number> }) {
  const pieces: string[] = [];
  for (const p of ["q", "r", "b", "n", "p"]) {
    for (let i = 0; i < (captured[p] ?? 0); i++) {
      pieces.push(PIECE_GLYPHS[p]);
    }
  }
  if (!pieces.length) return null;
  return (
    <span className="flex items-center flex-wrap gap-px">
      {pieces.map((g, i) => (
        <span
          key={i}
          className="text-[14px] leading-none opacity-80"
          style={{ color: "#e5e5e5" }}
        >
          {g}
        </span>
      ))}
    </span>
  );
}

function MaterialBar({ diff }: { diff: number }) {
  const whitePct = Math.min(Math.max(50 + diff * 2.5, 10), 90);
  return (
    <div className="h-3 flex overflow-hidden border-t border-[#242424] relative">
      <div
        className="bg-[#d4d4d4] h-full transition-all duration-300"
        style={{ width: `${whitePct}%` }}
      />
      <div className="bg-[#333333] flex-1 h-full" />
      {diff > 0 && (
        <span className="absolute left-1 top-0 text-[10px] font-bold leading-3 text-[#737373]">
          +{diff}
        </span>
      )}
      {diff < 0 && (
        <span className="absolute right-1 top-0 text-[10px] font-bold leading-3 text-[#737373]">
          +{Math.abs(diff)}
        </span>
      )}
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center flex-1 py-1.5 border-r border-[#1a1a1a] last:border-r-0">
      <span className="text-[10px] text-[#737373] uppercase tracking-widest mb-0.5">
        {label}
      </span>
      <span className="text-xs font-medium text-[#a3a3a3]">{value}</span>
    </div>
  );
}
