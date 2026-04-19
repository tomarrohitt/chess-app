"use client";

import { CheckCheck } from "lucide-react";
import { useInbox } from "./inbox-context";
import { useSocket } from "@/store/socket-provider";
import { cn } from "@/lib/utils";

export const MarkAsReadBtn = () => {
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
  );
};
