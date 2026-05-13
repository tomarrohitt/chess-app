import { memo, useRef, useEffect, useCallback } from "react";
import { useGameStore } from "@/store/use-game-store";
import { useSocket } from "@/store/socket-provider";
import { cn, scrollClass } from "@/lib/utils";
import Image from "next/image";

interface GameChatProps {
  gameId: string;
  isPlayer: boolean;
}

export const GameChat = memo(function GameChat({
  gameId,
  isPlayer,
}: GameChatProps) {
  const chatMessages = useGameStore((s) => s.chatMessages);
  const { sendChatMessage, joinGameChat } = useSocket();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (isNearBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    joinGameChat(gameId);
  }, [gameId]);

  const handleSubmit = useCallback(
    (e: React.SubmitEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const input = formData.get("message") as string;

      if (!input || !input.trim()) return;

      sendChatMessage(gameId, input.trim());
      e.currentTarget.reset();
    },
    [gameId, sendChatMessage],
  );

  return (
    <div className="flex flex-col h-70 border-t border-zinc-800/40 w-full bg-zinc-950/50">
      <div
        className={cn(
          "flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar",
          scrollClass,
        )}
        ref={scrollRef}
      >
        {chatMessages.length === 0 ? (
          <p className="text-zinc-500 text-xs italic text-center mt-2">
            No messages yet. Be the first to say hi!
          </p>
        ) : (
          chatMessages.map((msg, idx) => (
            <div
              key={msg.id || idx}
              className="flex items-start gap-2 text-sm mb-3"
            >
              {msg.sender.image ? (
                <Image
                  src={msg.sender.image}
                  alt={msg.sender.username}
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded object-cover bg-zinc-800 shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center shrink-0 text-xs font-bold text-zinc-400">
                  {msg.sender.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col leading-tight">
                <span className="font-semibold text-zinc-400 text-xs mb-0.5">
                  {msg.sender.username}
                </span>
                <span className="text-zinc-200 wrap-break-word">
                  {msg.content}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
      <form
        onSubmit={handleSubmit}
        className="p-2 border-t border-zinc-800/40 flex gap-2"
      >
        <input
          name="message"
          type="text"
          placeholder={
            isPlayer ? "Send a message..." : "Chat is for players only"
          }
          disabled={!isPlayer}
          className="flex-1 bg-zinc-900 border border-zinc-800 text-sm text-white px-3 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </form>
    </div>
  );
});
