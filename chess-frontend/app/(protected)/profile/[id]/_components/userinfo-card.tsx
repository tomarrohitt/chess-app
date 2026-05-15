import { Calendar, Crown } from "lucide-react";

import { User } from "@/types/auth";
import { MiniStat } from "./common";
import { UserProfile } from "./user-profile";
import { PlayerProfile } from "./player-profile";

export async function UserInfoCard({
  user,
  currentUser,
  rank,
  totalGames,
  winRate,
}: {
  currentUser: User | null;
  user: Omit<User, "emailVerified">;
  rank: { title: string; color: string };
  totalGames: number;
  winRate: string | number;
}) {
  return (
    <div className="bg-[#141414] border border-[#242424] rounded-[14px] backdrop-blur-sm pt-8 px-6 pb-8 flex flex-col items-center relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-[#4ade80] to-transparent opacity-70" />
      <div className="relative mb-4.5">
        {currentUser?.id === user.id ? (
          <UserProfile name={user.name} image={user.image} />
        ) : (
          <div className="w-25 h-25 rounded-full bg-[#0c0c0c] border-2 border-[#2a2a2a] flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.8)]">
            <PlayerProfile name={user.name} image={user.image} />
          </div>
        )}
      </div>

      <h2 className="text-[20px] font-bold text-[#f5f5f5] m-0 tracking-[0.02em]">
        {user.name}
      </h2>
      <p className="text-[13px] text-[#525252] mt-1 mb-3 font-mono">
        @{user.username}
      </p>

      <div className="flex items-center gap-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-[20px] py-1.25 px-3.5">
        <Crown size={13} color={rank.color} />
        <span
          className="text-[12px] font-semibold tracking-[0.08em] uppercase"
          style={{ color: rank.color }}
        >
          {rank.title}
        </span>
      </div>

      <div className="w-full h-px bg-[#1f1f1f] my-4" />

      <div className="grid grid-cols-2 gap-2.5 w-full">
        <MiniStat label="Games" value={totalGames} />
        <MiniStat label="Win Rate" value={`${winRate}%`} />
      </div>
      <div className="mt-7">
        <p className="text-[11px] text-[#3a3a3a] uppercase tracking-widest mb-0.5 font-mono">
          Member Since
        </p>
        <div className="flex items-center gap-2.5">
          <Calendar size={14} color="#555" />
          <span
            suppressHydrationWarning
            className="text-[13px] text-[#737373] overflow-hidden text-ellipsis whitespace-nowrap"
          >
            {new Date(user.createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
