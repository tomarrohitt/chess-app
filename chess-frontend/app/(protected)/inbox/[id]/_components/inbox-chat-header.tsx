import Link from "next/link";
import { Avatar } from "../../_components/inbox-shared";
import { ChatUserInfo } from "@/types/chat";

interface InboxChatHeaderProps {
  activeData: ChatUserInfo | null;
}

export function InboxChatHeader({ activeData }: InboxChatHeaderProps) {
  if (!activeData) return;
  return (
    <div
      className="h-16 px-6 border-b border-white/10 flex items-center justify-between shrink-0"
      style={{ background: "rgba(255,255,255,0.02)" }}
    >
      <div className="flex items-center gap-3">
        <Avatar name={activeData.name} image={activeData.image} />
        <div>
          <Link
            href={`/player/${activeData.id}`}
            className="font-bold text-white text-sm  hover:underline underline-offset-3"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {activeData.name}
          </Link>
          <p className="text-xs text-zinc-500 font-mono">
            @{activeData.username}
          </p>
        </div>
      </div>
    </div>
  );
}
