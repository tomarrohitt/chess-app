import { Avatar } from "../../_components/inbox-shared";
import { ChatUserInfo } from "@/types/chat";

interface InboxChatHeaderProps {
  activeData: ChatUserInfo | null;
  children: React.ReactNode;
}

export function InboxChatHeader({
  activeData,
  children,
}: InboxChatHeaderProps) {
  if (!activeData) return;
  return (
    <div
      className="h-16 px-6 border-b border-white/10 flex items-center justify-between shrink-0"
      style={{ background: "rgba(255,255,255,0.02)" }}
    >
      <div className="flex items-center gap-3">
        <Avatar name={activeData.name} image={activeData.image} />
        <div>
          <h3
            className="font-bold text-white text-sm"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {activeData.name}
          </h3>
          <p className="text-xs text-zinc-500 font-mono">
            @{activeData.username}
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}
