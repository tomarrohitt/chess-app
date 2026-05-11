export const playAudio = (soundFile: string) => {
  const audio = new Audio(soundFile);
  audio.play().catch((e) => console.log("Audio play blocked by browser:", e));
};

export const getMoveSoundFile = (
  move: string | undefined | null,
  isMyMove: boolean,
  isViewer: boolean = false,
): string => {
  let soundFile = isMyMove ? "/move-self.mp3" : "/move-opponent.mp3";

  if (isViewer) soundFile = "/move-self.mp3";

  if (!move) return soundFile;

  if (move.includes("=")) {
    soundFile = "/promote.mp3";
  } else if (move.includes("+") || move.includes("#")) {
    soundFile = "/move-check.mp3";
  } else if (move.includes("O-O")) {
    soundFile = "/castle.mp3";
  } else if (move.includes("x")) {
    soundFile = "/capture.mp3";
  }

  return soundFile;
};
