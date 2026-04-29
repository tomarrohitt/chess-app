import Image from "next/image";
import { memo, useCallback } from "react";

const FlipButtonComponent = ({
  isPlayer,
  setSpectatorFlipped,
}: {
  isPlayer: boolean;
  setSpectatorFlipped: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const handleFlip = useCallback(
    () => setSpectatorFlipped((prev) => !prev),
    [setSpectatorFlipped],
  );

  if (!isPlayer) {
    return (
      <button
        onClick={handleFlip}
        className="absolute top-5 -left-16 cursor-pointer hover:scale-110 transition-transform p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
      >
        <Image src="/flip.svg" alt="" height={20} width={20} />
      </button>
    );
  }
};
export const FlipButton = memo(FlipButtonComponent);
