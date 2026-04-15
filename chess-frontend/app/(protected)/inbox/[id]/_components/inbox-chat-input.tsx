"use client";

import { ChatMessage } from "@/types/chat";
import { Send } from "lucide-react";
import { useInbox } from "../../_components/inbox-context";
import { useState } from "react";
import { useSocket } from "@/store/socket-provider";

export function InboxChatInput({
  currentUserId,
  chatId,
}: {
  currentUserId: string;
  chatId: string;
}) {
  const addMessage = useInbox((s) => s.addMessage);
  const { sendDirectMessage } = useSocket();

  const [message, setMessage] = useState("");

  const handleSendMessage = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const optimistic: ChatMessage = {
      id: `temp-${Date.now()}-${Math.random()}`,
      content: message.trim(),
      senderId: currentUserId,
      receiverId: chatId,
      createdAt: new Date().toISOString(),
      read: true,
    };

    addMessage(chatId, optimistic);

    sendDirectMessage?.(chatId, message.trim());
    setMessage("");
  };

  return (
    <div
      className="p-4 border-t border-white/10"
      style={{ background: "rgba(255,255,255,0.02)" }}
    >
      <form className="flex items-center gap-2" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
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
  );
}
