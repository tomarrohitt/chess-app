import { User as UserIcon, UserMinus, UserX, Swords } from "lucide-react";
import { Avatar } from "../../_components/inbox-shared";
import { blockUser, removeFriend } from "@/actions/friend";
import { ChatUserInfo } from "@/types/chat";

interface InboxInfoProps {
  activeData: ChatUserInfo | null;
  children: React.ReactNode;
}

export function InboxInfo({ activeData, children }: InboxInfoProps) {
  if (!activeData) return null;

  return (
    <div
      className="w-72 flex flex-col rounded-2xl overflow-hidden shrink-0"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        className="p-6 flex flex-col items-center border-b border-white/10"
        style={{ background: "rgba(255,255,255,0.02)" }}
      >
        <Avatar name={activeData.name} image={activeData.image} size={80} />
        <h3
          className="mt-4 font-bold text-white text-lg text-center"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {activeData.name}
        </h3>
        <p className="text-sm text-zinc-400 font-mono mt-1">
          @{activeData.username}
        </p>
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1 overflow-y-auto min-h-0">
        <button className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-zinc-300 text-sm font-medium w-full text-left cursor-pointer">
          <UserIcon size={16} className="text-zinc-400" />
          View Profile
        </button>
        {children}

        <div className="h-px w-full bg-white/10 my-2 shrink-0" />

        <button
          onClick={() => removeFriend(activeData.id)}
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-rose-500/10 transition-colors text-rose-400 text-sm font-medium w-full text-left cursor-pointer"
        >
          <UserMinus size={16} />
          Unfriend
        </button>
        <button
          onClick={() => blockUser(activeData.id)}
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 transition-colors text-red-500 text-sm font-medium w-full text-left cursor-pointer"
        >
          <UserX size={16} />
          Block User
        </button>
      </div>
    </div>
  );
}
