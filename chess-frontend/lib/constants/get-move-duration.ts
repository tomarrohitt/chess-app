function getMoveDurations(pgn: string, baseTimeMs: number): number[] {
  const clockRegex = /\[%clk (\d+):(\d{2}):(\d{2})\]/g;
  const matches = [...pgn.matchAll(clockRegex)];

  const clockSnapshots = matches.map(m => {
    const hours = parseInt(m[1]);
    const mins = parseInt(m[2]);
    const secs = parseInt(m[3]);
    return (hours * 3600 + mins * 60 + secs) * 1000;
  });

  const durations: number[] = [];
  let lastWhiteTime = baseTimeMs;
  let lastBlackTime = baseTimeMs;

  clockSnapshots.forEach((currentTime, index) => {
    const isWhiteMove = index % 2 === 0;

    if (isWhiteMove) {
      durations.push(lastWhiteTime - currentTime);
      lastWhiteTime = currentTime;
    } else {
      durations.push(lastBlackTime - currentTime);
      lastBlackTime = currentTime;
    }
  });

  return durations;
}