"use client";

import { useState, useEffect, useRef } from "react";
import { User } from "@/types/auth";
import {
  Search,
  Send,
  MessageSquare,
  Info,
  User as UserIcon,
  UserMinus,
  UserX,
  Swords,
} from "lucide-react";
import { getAvatarHue } from "@/app/(protected)/community/_components/community-shared";
import { useSocket } from "@/store/socket-provider";
import { getChatHistory } from "@/actions/chat";
import { blockUser, removeFriend } from "@/actions/friend";
import { cn, scrollClass } from "@/lib/utils";

interface InboxClientProps {
  currentUser: User;
  initialUserId?: string;
  friends: any[];
  conversations: any[];
}

function Avatar({
  name,
  image,
  size = 44,
}: {
  name: string;
  image?: string | null;
  size?: number;
}) {
  const hue = getAvatarHue(name);
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold shrink-0 overflow-hidden"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: image ? "transparent" : `hsl(${hue},45%,32%)`,
        color: `hsl(${hue},80%,82%)`,
        fontFamily: "'Fira Code', monospace",
      }}
    >
      {image ? (
        <img src={image} alt={name} className="w-full h-full object-cover" />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </div>
  );
}

function formatTime(dateString: string | Date) {
  const d = new Date(dateString);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function InboxClient({
  currentUser,
  initialUserId,
  friends,
  conversations,
}: InboxClientProps) {
  const [activeConversation, setActiveConversation] = useState<string | null>(
    initialUserId || null,
  );
  const [message, setMessage] = useState("");
  const [showInfo, setShowInfo] = useState(true);
  const [messagesMap, setMessagesMap] = useState<Record<string, any[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { sendDirectMessage, sendTyping, offerChallenge } = useSocket();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesMap, activeConversation]);

  useEffect(() => {
    if (!activeConversation) return;
    if (messagesMap[activeConversation]) return;

    getChatHistory(activeConversation).then((history) => {
      setMessagesMap((prev) => ({
        ...prev,
        [activeConversation]: history || [],
      }));
    });
  }, [activeConversation, messagesMap]);

  useEffect(() => {
    // Clear local unread status automatically when switching active conversations
    if (activeConversation && messagesMap[activeConversation]) {
      setMessagesMap((prev) => {
        const chat = prev[activeConversation];
        if (
          !chat.some(
            (m) => !m.read && (m.sender?.id || m.senderId) !== currentUser.id,
          )
        )
          return prev;
        return {
          ...prev,
          [activeConversation]: chat.map((m) => ({ ...m, read: true })),
        };
      });
    }
  }, [activeConversation, messagesMap]);

  useEffect(() => {
    const handleChatMessage = (e: CustomEvent) => {
      const msg = e.detail;
      const senderId = msg.sender?.id || msg.senderId;
      const otherUserId =
        senderId === currentUser.id ? msg.receiverId : senderId;

      setMessagesMap((prev) => {
        const conversation = prev[otherUserId] || [];
        if (conversation.some((m) => m.id === msg.id)) return prev;

        const updated = [...conversation, msg].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        if (otherUserId === activeConversation)
          updated[updated.length - 1].read = true;
        return { ...prev, [otherUserId]: updated };
      });
    };

    const handleTyping = (e: CustomEvent) => {
      const { senderId, isTyping } = e.detail;
      setTypingUsers((prev) => ({ ...prev, [senderId]: isTyping }));
    };

    window.addEventListener("chat_message", handleChatMessage as EventListener);
    window.addEventListener("chat_typing", handleTyping as EventListener);
    return () => {
      window.removeEventListener(
        "chat_message",
        handleChatMessage as EventListener,
      );
      window.removeEventListener("chat_typing", handleTyping as EventListener);
    };
  }, [currentUser.id, activeConversation]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !activeConversation) return;

    if (sendDirectMessage) {
      sendDirectMessage(activeConversation, message.trim());
      if (sendTyping) sendTyping(activeConversation, false);
    }
    setMessage("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    if (activeConversation && sendTyping) {
      sendTyping(activeConversation, true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(activeConversation, false);
      }, 2000);
    }
  };

  const getLatestMessage = (friendId: string) => {
    const localMsgs = messagesMap[friendId];
    if (localMsgs && localMsgs.length > 0)
      return localMsgs[localMsgs.length - 1];
    const conv = conversations?.find((c) => c.user.id === friendId);
    return conv ? conv.lastMessage : null;
  };

  const enrichedFriends = (friends || []).map((f) => {
    const lastMsg = getLatestMessage(f.id);
    return {
      ...f,
      lastMessage: lastMsg?.content || null,
      timestamp: lastMsg?.createdAt || null,
    };
  });

  enrichedFriends.sort((a, b) => {
    if (a.timestamp && b.timestamp)
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    if (a.timestamp) return -1;
    if (b.timestamp) return 1;
    return a.name.localeCompare(b.name);
  });

  const filteredFriends = enrichedFriends.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.username.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const activeData = activeConversation
    ? friends?.find((f) => f.id === activeConversation)
    : null;
  const activeMessages = activeConversation
    ? messagesMap[activeConversation] || []
    : [];

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto flex gap-4 h-[calc(100vh-100px)] py-6 px-4">
      <div
        className="w-80 flex flex-col rounded-2xl overflow-hidden shrink-0 h-[calc(100vh-90px)]"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="p-4 border-b border-white/10">
          <h2
            className="text-xl font-bold text-white mb-4"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: "-0.03em",
            }}
          >
            Messages
          </h2>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
          {filteredFriends.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveConversation(f.id)}
              className="flex items-center gap-3 p-2.5 rounded-xl transition-all w-full text-left cursor-pointer hover:bg-white/5"
              style={{
                background:
                  activeConversation === f.id
                    ? "rgba(255,255,255,0.08)"
                    : "transparent",
              }}
            >
              <Avatar name={f.name} image={f.image} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="font-semibold text-sm text-white truncate"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {f.name}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  {typingUsers[f.id] ? (
                    <span className="text-xs text-blue-400 font-medium italic animate-pulse">
                      Typing...
                    </span>
                  ) : f.lastMessage ? (
                    <span className="text-xs text-zinc-400 truncate">
                      {f.lastMessage}
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-500 truncate font-mono">
                      @{f.username}
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    {(() => {
                      const unreadCount =
                        messagesMap[f.id]?.filter(
                          (m) =>
                            !m.read &&
                            (m.sender?.id || m.senderId) !== currentUser.id,
                        ).length || 0;
                      if (unreadCount === 0) return null;
                      return (
                        <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                          {unreadCount}
                        </span>
                      );
                    })()}
                    {!typingUsers[f.id] && f.timestamp && (
                      <span className="text-[10px] text-zinc-500 shrink-0 font-mono">
                        {formatTime(f.timestamp)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div
        className="flex-1 flex flex-col rounded-2xl h-[calc(100vh-90px)] overflow-y-auto"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {activeData ? (
          <>
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
              <button
                onClick={() => setShowInfo((prev) => !prev)}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  showInfo
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Info size={18} />
              </button>
            </div>

            <div
              className={cn(
                "flex-1 p-6 overflow-y-scroll flex flex-col gap-4",
                scrollClass,
              )}
            >
              {activeMessages.map((msg) => {
                const senderId = msg.sender?.id || msg.senderId;
                const isMe = senderId === currentUser.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[75%] ${isMe ? "self-end items-end" : "self-start items-start"}`}
                  >
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm ${
                        isMe
                          ? "bg-blue-600 text-white rounded-br-sm"
                          : "bg-zinc-800 text-zinc-200 rounded-bl-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1 px-1 font-mono">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div
              className="p-4 border-t border-white/10"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <form
                className="flex items-center gap-2"
                onSubmit={handleSendMessage}
              >
                <input
                  type="text"
                  value={message}
                  onChange={handleInputChange}
                  placeholder="Message..."
                  className="flex-1 h-10 rounded-xl px-4 text-sm text-white placeholder:text-zinc-600 outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                />
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="h-10 w-10 shrink-0 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 flex items-center justify-center text-white transition-colors cursor-pointer"
                >
                  <Send size={16} className="-ml-0.5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <MessageSquare size={32} className="opacity-50" />
            </div>
            <p
              className="text-sm font-semibold text-zinc-400"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Your Messages
            </p>
            <p className="text-xs mt-1">Select a friend to start chatting</p>
          </div>
        )}
      </div>

      {showInfo && activeData && (
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
            <button
              onClick={() =>
                offerChallenge && offerChallenge(activeData.id, "10+0")
              }
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-zinc-300 text-sm font-medium w-full text-left cursor-pointer"
            >
              <Swords size={16} className="text-amber-400" />
              Challenge
            </button>

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
      )}
    </div>
  );
}
