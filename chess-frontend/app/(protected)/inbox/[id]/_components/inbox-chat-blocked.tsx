import { Ban } from "lucide-react";

export function InboxChatBlocked() {
  return (
    <div
      className="border-t border-white/10"
      style={{ background: "rgba(255,255,255,0.02)" }}
    >
      <div
        className="flex items-center justify-center gap-2 w-full h-14  text-sm text-zinc-500 select-none"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <Ban size={16} className="opacity-70" />
        <span>You cannot send messages to this user.</span>
      </div>
    </div>
  );
}
