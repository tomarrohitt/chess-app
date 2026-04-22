"use client";
import { cn, scrollClass } from "@/lib/utils";
import { formatTime } from "../../_components/inbox-shared";
import { User } from "@/types/auth";
import { useInbox } from "../../_components/inbox-context";
import { ChatMessage } from "@/types/chat";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useSocket } from "@/store/socket-provider";
import { getChatHistory } from "@/actions/chat";

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
  initialNextCursor: string | null;
  initialHasMore: boolean;
  children: React.ReactNode;
}

export function InboxChatList({
  otherUserId,
  currentUser,
  initialMessages,
  initialNextCursor,
  initialHasMore,

  children,
}: InboxChatListProps) {
  const [cursor, setCursor] = useState(initialNextCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, startLoading] = useTransition();
  const [olderMessages, setOlderMessages] = useState<ChatMessage[]>([]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const observerTargetRef = useRef<HTMLDivElement>(null);
  const previousScrollHeightRef = useRef<number>(0);
  const isFetchingRef = useRef(false);

  const storeMessages = useInbox((s) => s.messagesMap[otherUserId]);
  const messages = [...olderMessages, ...(storeMessages ?? initialMessages)];
  const markChatAsRead = useInbox((s) => s.markChatAsRead);
  const { markChatRead } = useSocket();

  const loadMoreMessages = useCallback(async () => {
    if (isFetchingRef.current || !hasMore || !cursor) return;

    startLoading(async () => {
      isFetchingRef.current = true;
      try {
        if (scrollContainerRef.current) {
          previousScrollHeightRef.current =
            scrollContainerRef.current.scrollHeight;
        }
        const result = await getChatHistory(otherUserId, cursor);
        if (!result) return;

        const {
          messages: newOlderMessages,
          nextCursor,
          hasMore: moreAvailable,
        } = result;

        setOlderMessages((prev) => [...newOlderMessages, ...prev]);
        setCursor(nextCursor);
        setHasMore(moreAvailable);
      } catch (error) {
        console.error(error);
      } finally {
        isFetchingRef.current = false;
      }
    });
  }, [cursor, hasMore, otherUserId]);

  useEffect(() => {
    const target = observerTargetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreMessages();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMoreMessages]);

  useLayoutEffect(() => {
    if (previousScrollHeightRef.current > 0 && scrollContainerRef.current) {
      const newScrollHeight = scrollContainerRef.current.scrollHeight;
      const heightDifference =
        newScrollHeight - previousScrollHeightRef.current;

      scrollContainerRef.current.scrollTop += heightDifference;

      previousScrollHeightRef.current = 0;
    }
  }, [messages.length]);

  useEffect(() => {
    markChatAsRead(otherUserId);
    markChatRead?.(otherUserId);
  }, [otherUserId, messages.length, markChatAsRead, markChatRead]);

  return (
    <div
      ref={scrollContainerRef}
      className={cn("flex-1 p-6 overflow-y-scroll flex flex-col", scrollClass)}
    >
      {hasMore && (
        <div
          ref={observerTargetRef}
          className="w-full h-4 flex justify-center items-center my-2"
        >
          {loading && (
            <span className="text-xs text-zinc-500">
              Loading older messages...
            </span>
          )}
        </div>
      )}
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
