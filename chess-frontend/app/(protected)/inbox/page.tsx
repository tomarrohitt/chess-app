import { MessageSquare } from "lucide-react";

export default function InboxPage() {
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center text-zinc-500 rounded-2xl h-[calc(100vh-90px)]"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
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
  );
}
