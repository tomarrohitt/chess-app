export function calculateNewRatings(
  ratingA: number,
  ratingB: number,
  scoreA: number,
) {
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const expectedB = 1 - expectedA;

  const getK = (r: number) => (r < 1200 ? 40 : r > 2400 ? 16 : 32);
  const kA = getK(ratingA);
  const kB = getK(ratingB);

  let newRatingA = Math.round(ratingA + kA * (scoreA - expectedA));
  let newRatingB = Math.round(ratingB + kB * (1 - scoreA - expectedB));

  const FLOOR = 100;
  newRatingA = Math.max(newRatingA, FLOOR);
  newRatingB = Math.max(newRatingB, FLOOR);

  return {
    newRatingA,
    newRatingB,
    diffA: newRatingA - ratingA,
    diffB: newRatingB - ratingB,
  };
}
