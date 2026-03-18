export const getMaterialScore = (pieces: string[] | undefined) => {
  if (!pieces) return 0;
  const values: Record<string, number> = {
    p: 1,
    n: 3,
    b: 3,
    r: 5,
    q: 9,
    P: 1,
    N: 3,
    B: 3,
    R: 5,
    Q: 9,
  };
  return pieces.reduce((sum, p) => sum + (values[p] || 0), 0);
};
