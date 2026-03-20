export function clkToMs(clk: string): number {
  const match = clk.match(/(\d+):(\d{2}):(\d+(?:\.\d+)?)/);
  if (!match) return 0;
  return (
    (parseInt(match[1]) * 3600 +
      parseInt(match[2]) * 60 +
      parseFloat(match[3])) *
    1000
  );
}

export function getTimesAtMove(
  pgn: string,
  timeControl: string,
  currentMoveIndex: number,
) {
  let initialMs = 300000; // 5 minutes fallback
  if (timeControl) {
    const [mins] = timeControl.split("+").map(Number);
    if (!isNaN(mins)) initialMs = mins * 60 * 1000;
  }

  if (!pgn || currentMoveIndex === -1) {
    return { whiteTimeLeftMs: initialMs, blackTimeLeftMs: initialMs };
  }

  const clkMatches = [
    ...pgn.matchAll(/\[%clk (\d+:\d{2}:\d+(?:\.\d+)?)\]/g),
  ].map((m) => clkToMs(m[1]));

  let whiteTimeLeftMs = initialMs;
  let blackTimeLeftMs = initialMs;

  const latestWhiteIndex =
    currentMoveIndex % 2 === 0 ? currentMoveIndex : currentMoveIndex - 1;
  const latestBlackIndex =
    currentMoveIndex % 2 === 1 ? currentMoveIndex : currentMoveIndex - 1;

  if (latestWhiteIndex >= 0 && clkMatches[latestWhiteIndex] !== undefined) {
    whiteTimeLeftMs = clkMatches[latestWhiteIndex];
  }
  if (latestBlackIndex >= 0 && clkMatches[latestBlackIndex] !== undefined) {
    blackTimeLeftMs = clkMatches[latestBlackIndex];
  }

  return { whiteTimeLeftMs, blackTimeLeftMs };
}
