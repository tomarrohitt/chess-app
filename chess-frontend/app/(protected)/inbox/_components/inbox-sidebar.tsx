import { cn, scrollClass } from "@/lib/utils";
import { MarkAsReadBtn } from "./mark-as-read-burron";

interface InboxSidebarProps {
  content: React.ReactNode;
  children: React.ReactNode;
}

export function InboxSidebar({ content, children }: InboxSidebarProps) {
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
          <MarkAsReadBtn />
        </div>
        {content}
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
