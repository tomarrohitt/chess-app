"use client";

import { CheckCheck, Search } from "lucide-react";
import { cn, scrollClass } from "@/lib/utils";
import { useInbox } from "./inbox-context";
import { useSocket } from "@/store/socket-provider";

interface InboxSidebarProps {
  children: React.ReactNode;
}

export function InboxSidebar({ children }: InboxSidebarProps) {
  const unreadCounts = useInbox((s) => s.unreadCounts);
  const markChatAsRead = useInbox((s) => s.markChatAsRead);
  const { markAllChatsRead } = useSocket();

  const hasUnread = Object.values(unreadCounts).some((count) => count > 0);

  const handleMarkAllAsRead = () => {
    markAllChatsRead?.();

    Object.entries(unreadCounts).forEach(([chatId, count]) => {
      if (count > 0) {
        markChatAsRead(chatId);
      }
    });
  };

  return (
    <div
      className="w-80 flex flex-col rounded-2xl overflow-hidden shrink-0 h-[calc(100vh-90px)]"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-xl font-bold text-white"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: "-0.03em",
            }}
          >
            Messages
          </h2>
          <button
            onClick={handleMarkAllAsRead}
            disabled={!hasUnread}
            className={cn(
              "text-xs flex items-center gap-1 transition-colors",
              hasUnread
                ? "cursor-pointer text-blue-400 hover:text-blue-300"
                : "cursor-not-allowed text-gray-400 hover:text-gray-300",
            )}
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        </div>
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            placeholder="Search conversations..."
            className="w-full h-10 rounded-xl pl-9 pr-4 text-sm text-white placeholder:text-zinc-600 outline-none transition-all"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
        </div>
      </div>

      <div
        className={cn(
          "flex-1 p-2 flex flex-col gap-1 min-h-0 overflow-y-scroll",
          scrollClass,
        )}
      >
        {children}
      </div>
    </div>
  );
}
