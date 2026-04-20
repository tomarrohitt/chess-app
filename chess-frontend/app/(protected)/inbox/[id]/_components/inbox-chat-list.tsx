"use client";
import { cn, scrollClass } from "@/lib/utils";
import { formatTime } from "../../_components/inbox-shared";
import { User } from "@/types/auth";
import { useInbox } from "../../_components/inbox-context";
import { ChatMessage } from "@/types/chat";
import { useEffect } from "react";
import { useSocket } from "@/store/socket-provider";

function formatSeparatorDate(dateString: string | Date) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  const today = new Date();
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  const timeStr = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  if (isToday) return `Today ${timeStr}`;
  return `${date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  })}, ${timeStr}`;
}

interface InboxChatListProps {
  otherUserId: string;
  currentUser: User;
  initialMessages: ChatMessage[];
  children: React.ReactNode;
}

export function InboxChatList({
  otherUserId,
  currentUser,
  initialMessages,
  children,
}: InboxChatListProps) {
  const storeMessages = useInbox((s) => s.messagesMap[otherUserId]) ?? [];
  const messages = storeMessages ?? initialMessages;
  const markChatAsRead = useInbox((s) => s.markChatAsRead);
  const { markChatRead } = useSocket();

  useEffect(() => {
    markChatAsRead(otherUserId);
    markChatRead?.(otherUserId);
  }, [otherUserId, messages.length, markChatAsRead, markChatRead]);

  return (
    <div
      className={cn("flex-1 p-6 overflow-y-scroll flex flex-col", scrollClass)}
    >
      {messages.map((msg, index) => {
        const senderId = msg.senderId;
        const isMe = senderId === currentUser.id;

        const prevMsg = messages[index - 1];
        const nextMsg = messages[index + 1];

        const prevSenderId = prevMsg?.senderId;
        const nextSenderId = nextMsg?.senderId;

        const currentCreatedAt = msg.createdAt
          ? new Date(msg.createdAt).getTime()
          : 0;
        const prevCreatedAt = prevMsg?.createdAt
          ? new Date(prevMsg.createdAt).getTime()
          : 0;
        const nextCreatedAt = nextMsg?.createdAt
          ? new Date(nextMsg.createdAt).getTime()
          : 0;

        const timeFromPrev =
          prevCreatedAt && currentCreatedAt
            ? currentCreatedAt - prevCreatedAt
            : 0;
        const timeToNext =
          nextCreatedAt && currentCreatedAt
            ? nextCreatedAt - currentCreatedAt
            : 0;

        const showTimeSeparator = !prevMsg || timeFromPrev > 10 * 60 * 1000;
        const isFirstInGroup = showTimeSeparator || prevSenderId !== senderId;
        const isLastInGroup =
          !nextMsg || nextSenderId !== senderId || timeToNext > 10 * 60 * 1000;

        const marginTop = showTimeSeparator
          ? "mt-2"
          : isFirstInGroup
            ? "mt-4"
            : "mt-0.5";

        return (
          <div key={msg.id} className="flex flex-col w-full">
            {showTimeSeparator && (
              <div className="flex justify-center my-4">
                <span
                  className="text-[10px] text-zinc-500 font-semibold bg-white/5 px-3 py-1 rounded-full tracking-wider"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {formatSeparatorDate(msg.createdAt)}
                </span>
              </div>
            )}
            <div
              className={cn(
                "flex flex-col max-w-[75%]",
                isMe ? "self-end items-end" : "self-start items-start",
                marginTop,
              )}
            >
              <div
                className={cn(
                  "px-4 py-2.5 text-sm rounded-2xl",
                  isMe ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-200",
                  isLastInGroup && (isMe ? "rounded-br-sm" : "rounded-bl-sm"),
                )}
              >
                {msg.content}
              </div>
              {isLastInGroup && (
                <span className="text-[10px] text-zinc-500 mt-1 px-1 font-mono">
                  {formatTime(msg.createdAt)}
                </span>
              )}
            </div>
          </div>
        );
      })}
      {children}
    </div>
  );
}
