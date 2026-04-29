"use client";
import { useSocket } from "@/store/socket-provider";
import { useGameStore } from "@/store/use-game-store";
import { useRouter } from "next/navigation";
import { GameStatus } from "@/types/chess";

type JoinButtonProps = { label: string; value: string };

const JoinButton = ({ label, value }: JoinButtonProps) => {
  const { joinQueue } = useSocket();
  const activeGame = useGameStore((s) => s.activeGame);
  const router = useRouter();

  const handleClick = () => {
    if (activeGame && activeGame.status === GameStatus.IN_PROGRESS) {
      router.push(`/game/${activeGame.gameId}`);
    } else {
      joinQueue(value);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full py-2.5 px-4 rounded-md bg-zinc-800/60 hover:bg-zinc-700/80 border border-zinc-700/40 hover:border-zinc-600/60 text-zinc-300 hover:text-zinc-100 font-mono font-medium text-sm tracking-wide transition-all duration-100 hover:scale-[1.015] active:scale-[0.985]"
    >
      {label}
    </button>
  );
};

export default JoinButton;
