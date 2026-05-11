// _components/flip-button.tsx
import Image from "next/image";
import { memo } from "react";

interface FlipButtonProps {
  onFlip: () => void;
}

export const FlipButton = memo(function FlipButton({
  onFlip,
}: FlipButtonProps) {
  return (
    <button
      onClick={onFlip}
      className="absolute top-5 -left-16 cursor-pointer hover:scale-110 transition-transform p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
    >
      <Image src="/flip.svg" alt="Flip board" height={20} width={20} />
    </button>
  );
});
