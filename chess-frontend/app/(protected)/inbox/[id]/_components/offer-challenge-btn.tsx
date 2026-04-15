"use client";
import { useSocket } from "@/store/socket-provider";
import { Swords } from "lucide-react";

export const OfferChallengeBtn = ({ id }: { id: string }) => {
  const { offerChallenge } = useSocket();

  return (
    <button
      onClick={() => offerChallenge(id, "10+0")}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-zinc-300 text-sm font-medium w-full text-left cursor-pointer"
    >
      <Swords size={16} className="text-amber-400" />
      Challenge
    </button>
  );
};
