import Link from "next/link";
import { GameStatus } from "@/types/chess";
import { GameboardSnapshot } from "./gameboard-snapshot";
import { redirect } from "next/dist/client/components/navigation";
import { getUserFromSession } from "@/actions/session";
import { cn, scrollClass } from "@/lib/utils";
import { GameRecord } from "@/types/history";

const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };
const PIECE_GLYPHS: Record<string, string> = {
  q: "♕",
  r: "♖",
  b: "♗",
  n: "♘",
  p: "♙",
};
const START_COUNTS: Record<string, number> = { p: 8, n: 2, b: 2, r: 2, q: 1 };

function parseFenPieces(fen: string) {
  const counts = {
    white: { p: 0, n: 0, b: 0, r: 0, q: 0 },
    black: { p: 0, n: 0, b: 0, r: 0, q: 0 },
  };
  for (const ch of fen.split(" ")[0]) {
    if (!/[pnbrq]/i.test(ch)) continue;
    const lower = ch.toLowerCase() as keyof typeof counts.white;
    if (ch === ch.toUpperCase()) counts.white[lower]++;
    else counts.black[lower]++;
  }
  return counts;
}

function getMaterialAdvantage(fen: string) {
  const pieces = parseFenPieces(fen);
  const capturedByWhite: Record<string, number> = {};
  const capturedByBlack: Record<string, number> = {};
  let whiteScore = 0,
    blackScore = 0;

  for (const p of ["p", "n", "b", "r", "q"] as const) {
    capturedByWhite[p] = Math.max(0, START_COUNTS[p] - pieces.black[p]);
    capturedByBlack[p] = Math.max(0, START_COUNTS[p] - pieces.white[p]);
    whiteScore += capturedByWhite[p] * PIECE_VALUES[p];
    blackScore += capturedByBlack[p] * PIECE_VALUES[p];
  }

  return {
    capturedByWhite,
    capturedByBlack,
    diff: whiteScore - blackScore,
  };
}

function countMoves(pgn: string): number {
  const moveText = pgn.replace(/\[[\s\S]*?\]/g, "").trim();
  return moveText
    .split(/\s+/)
    .filter(
      (t) =>
        t &&
        !/^\d+\./.test(t) &&
        !["*", "1-0", "0-1", "1/2-1/2"].includes(t) &&
        !/^\{/.test(t),
    ).length;
}

function avgMoveTime(moveTimes: number[]): number | null {
  const valid = moveTimes.filter((t) => t < 120_000);
  if (!valid.length) return null;
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length / 1000);
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
        <span key={i} className="text-sm leading-none opacity-80">
          {g}
        </span>
      ))}
    </span>
  );
}

function MaterialBar({ diff }: { diff: number }) {
  const whitePct = Math.min(Math.max(50 + diff * 2.5, 10), 90);
  return (
    <div className="h-3 flex overflow-hidden border-t border-zinc-800/60 relative">
      <div
        className="bg-zinc-200/80 h-full transition-all duration-300"
        style={{ width: `${whitePct}%` }}
      />
      <div className="bg-zinc-700/60 flex-1 h-full" />
      {diff > 0 && (
        <span className="absolute left-1 top-0 text-[10px] font-bold leading-3 text-zinc-400">
          +{diff}
        </span>
      )}
      {diff < 0 && (
        <span className="absolute right-1 top-0 text-[10px] font-bold leading-3 text-zinc-400">
          +{Math.abs(diff)}
        </span>
      )}
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center flex-1 py-1 border-r border-zinc-800/60 last:border-r-0">
      <span className="text-[10px] text-zinc-400 uppercase tracking-widest mb-0.5">
        {label}
      </span>
      <span className="text-xs font-medium text-zinc-400">{value}</span>
    </div>
  );
}

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

export async function GameBoardWithHistory({ games }: { games: GameRecord[] }) {
  const user = await getUserFromSession();

  if (!user) redirect("/login");
  const currentUserId = user.id;

  if (!games || games.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-8 text-center font-mono text-sm text-zinc-300 tracking-widest uppercase">
        No recent games
      </div>
    );
  }

  const wins = games.filter((g) => g.winnerId === currentUserId).length;
  const losses = games.filter(
    (g) =>
      g.winnerId &&
      g.winnerId !== currentUserId &&
      (g.white.id === currentUserId || g.black.id === currentUserId),
  ).length;
  const draws = games.filter(
    (g) => g.result === "d" && g.status !== GameStatus.ABANDONED,
  ).length;
  const total = wins + losses + draws || 1;

  const player =
    games[0]?.white.id === currentUserId ? games[0].white : games[0]?.black;
  const currentRating = player?.currentRating;
  const peakRating = Math.max(
    ...games.map((g) =>
      g.white.id === currentUserId ? g.white.matchRating : g.black.matchRating,
    ),
  );
  return (
    <div className="flex flex-col w-full">
      <div className="px-4 py-2 space-y-2">
        <div className="flex items-start justify-between ">
          <div>
            <p className="font-mono text-xs font-semibold tracking-[0.2em] uppercase text-amber-600/60 mb-1.5 my-2">
              Your record
            </p>
            <h2 className="font-serif text-2xl font-light text-zinc-100 tracking-tight leading-none">
              {total} games
            </h2>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <div className="flex flex-col items-center gap-0.5">
              <span className="font-mono text-xl font-medium leading-none text-emerald-400">
                {wins}
              </span>
              <span className="font-semibold text-xs tracking-[0.14em] uppercase text-emerald-500">
                W
              </span>
            </div>
            <div className="w-px h-7 bg-zinc-800/80" />
            <div className="flex flex-col items-center gap-0.5">
              <span className="font-mono text-xl font-medium leading-none text-zinc-200">
                {draws}
              </span>
              <span className="font-semibold text-xs tracking-[0.14em] uppercase text-zinc-200">
                D
              </span>
            </div>
            <div className="w-px h-7 bg-zinc-800/80" />
            <div className="flex flex-col items-center gap-0.5">
              <span className="font-mono text-xl font-medium leading-none text-rose-400">
                {losses}
              </span>
              <span className="font-semibold text-xs tracking-[0.14em] uppercase text-rose-500">
                L
              </span>
            </div>
          </div>
        </div>

        <div className="flex h-0.75 rounded-full overflow-hidden gap-px mb-1.5">
          {wins > 0 && (
            <div
              className="bg-emerald-800/70 rounded-l-full"
              style={{ flex: wins }}
            />
          )}
          {draws > 0 && (
            <div className="bg-zinc-700/50" style={{ flex: draws }} />
          )}
          {losses > 0 && (
            <div
              className="bg-rose-900/70 rounded-r-full"
              style={{ flex: losses }}
            />
          )}
        </div>

        {currentRating !== undefined && (
          <div className="flex items-center gap-2 mt-2.5">
            <span className="font-mono text-xs text-zinc-200 uppercase tracking-widest font-semibold">
              Rating
            </span>
            <span className="font-mono text-sm font-medium text-amber-600/80">
              {currentRating}
            </span>
            {peakRating > currentRating && (
              <>
                <span className="w-px h-3 bg-zinc-800" />
                <span className="font-mono text-xs text-zinc-200 uppercase tracking-widest font-semibold">
                  Peak
                </span>
                <span className="font-mono text-sm font-semibold text-green-400">
                  {peakRating}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      <div
        className={cn(
          "flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-160px)]",
          scrollClass,
        )}
      >
        {games.map((game) => {
          const isWhite = game.white.id === currentUserId;
          const won = game.winnerId === currentUserId;
          const draw = game.result === "d";
          const abandoned = game.status === GameStatus.ABANDONED;
          const lost = !won && !draw && !abandoned;

          const opponent = isWhite ? game.black : game.white;
          const player = isWhite ? game.white : game.black;

          const mat = getMaterialAdvantage(game.finalFen);
          const moveCount = countMoves(game.pgn);
          const avg = avgMoveTime(game.moveTimes);

          const myMatDiff = isWhite ? mat.diff : -mat.diff;
          const myCaptured = isWhite
            ? mat.capturedByWhite
            : mat.capturedByBlack;

          const ratingGap = opponent.matchRating - player.matchRating;

          const badgeStyle = abandoned
            ? "bg-zinc-900 text-zinc-300 border-zinc-800/60"
            : won
              ? "bg-emerald-950/70 text-emerald-400 border-emerald-900/60"
              : lost
                ? "bg-rose-950/70 text-rose-400 border-rose-900/60"
                : "bg-zinc-900 text-zinc-500 border-zinc-700/50";

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
              className="group flex items-stretch bg-zinc-900/70 border border-zinc-800/50  overflow-hidden hover:border-zinc-700/60 hover:bg-zinc-900 transition-all duration-100 shrink-0"
            >
              <div className="shrink-0 flex flex-col">
                <div style={{ width: 164, height: 164 }}>
                  <GameboardSnapshot game={game} isWhite={isWhite} />
                  <MaterialBar diff={mat.diff} />
                </div>
              </div>

              <div className="flex flex-col flex-1 min-w-0 px-3 py-2 gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-mono text-[10px] text-zinc-300 uppercase tracking-widest mb-0.5">
                      vs
                    </div>
                    <div className="font-mono text-base font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors truncate">
                      {opponent.username}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-xs text-zinc-500">
                        {opponent.matchRating}
                      </span>
                      {ratingGap !== 0 && (
                        <span
                          className={`font-mono text-[10px] font-semibold px-1.5 py-px rounded-sm ${
                            ratingGap > 0
                              ? "bg-amber-950/60 text-amber-500/90"
                              : "bg-zinc-800/60 text-zinc-500"
                          }`}
                        >
                          {ratingGap > 0 ? `+${ratingGap}` : ratingGap} rated
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`font-mono text-[10px] font-semibold tracking-wider px-2 py-1 rounded border shrink-0 uppercase ${badgeStyle}`}
                  >
                    {badgeLabel}
                  </span>
                </div>

                <div className="flex bg-zinc-950/60 rounded-md overflow-hidden border border-zinc-800/40">
                  <StatPill label="Moves" value={String(moveCount)} />
                  <StatPill
                    label="Avg"
                    value={avg !== null ? `${avg}s` : "—"}
                  />
                  <StatPill label="Rating" value={String(player.matchRating)} />
                  <StatPill label="Change" value={diffLabel} />
                </div>

                <div className="flex items-center gap-2 min-h-4">
                  {myMatDiff > 0 ? (
                    <>
                      <span className="font-mono text-xs text-amber-600/80 uppercase tracking-wider">
                        +{myMatDiff}
                      </span>
                      <PiecesDisplay captured={myCaptured} />
                    </>
                  ) : myMatDiff < 0 ? (
                    <span className="font-mono text-xs text-zinc-300 uppercase tracking-wider">
                      −{Math.abs(myMatDiff)} material
                    </span>
                  ) : (
                    <span className="font-mono text-xs text-zinc-400 uppercase tracking-wider">
                      Equal material
                    </span>
                  )}
                </div>

                {/* Row 4: meta footer */}
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs text-zinc-300">
                      {game.timeControl}
                    </span>
                    <span className="w-px h-px rounded-full bg-zinc-700" />
                    <span className="font-mono text-xs text-zinc-300">
                      {formatStatus(game.status)}
                    </span>
                    <span className="w-px h-px rounded-full bg-zinc-700" />
                    <span className="font-mono text-xs text-zinc-300">
                      {formatDate(game.createdAt)}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider">
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
