"use client";
import { useSocket } from "@/store/socket-provider";
import { useGameStore } from "@/store/use-game-store";
import { useRouter } from "next/navigation";
import { GameStatus } from "@/types/chess";

type JoinButtonProps = {
  label: string;
  value: string;
};

const JoinButton = ({ label, value }: JoinButtonProps) => {
  const { joinQueue } = useSocket();
  const { activeGame } = useGameStore((s) => s);
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
      key={value}
      onClick={handleClick}
      className="w-full py-2.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-500 text-white font-mono font-semibold text-sm transition-all duration-100 hover:scale-[1.02] active:scale-[0.97]"
    >
      {label}
    </button>
  );
};

export default JoinButton;
