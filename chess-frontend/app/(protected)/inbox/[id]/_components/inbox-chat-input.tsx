"use client";

import { ChatMessage } from "@/types/chat";
import { Send } from "lucide-react";
import { useInbox } from "../../_components/inbox-context";
import { useSocket } from "@/store/socket-provider";

export function InboxChatInput({
  currentUserId,
  otherUserId,
}: {
  currentUserId: string;
  otherUserId: string;
}) {
  const { addMessage } = useInbox((s) => s.actions);
  const { sendDirectMessage } = useSocket();

  const handleSendMessage = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const input = formData.get("message") as string;
    if (!input.trim()) return;
    const optimistic: ChatMessage = {
      id: `temp-${Date.now()}-${Math.random()}`,
      content: input.trim(),
      senderId: currentUserId,
      receiverId: otherUserId,
      createdAt: new Date().toISOString(),
    };

    addMessage(otherUserId, optimistic);
    sendDirectMessage?.(otherUserId, input.trim());
    e.currentTarget.reset();
  };

  return (
    <div
      className="p-4 border-t border-white/10"
      style={{ background: "rgba(255,255,255,0.02)" }}
    >
      <form className="flex items-center gap-2" onSubmit={handleSendMessage}>
        <input
          type="text"
          name="message"
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
          className="h-10 w-10 shrink-0 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 flex items-center justify-center text-white transition-colors cursor-pointer"
        >
          <Send size={16} className="-ml-0.5" />
        </button>
      </form>
    </div>
  );
}
