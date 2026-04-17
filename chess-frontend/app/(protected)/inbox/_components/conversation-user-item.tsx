import { Avatar, formatTime } from "./inbox-shared";

interface ConversationUserItemProps {
  f: {
    lastMessage: string;
    timestamp: string | Date;
    id: string;
    username: string;
    image: string | null;
    name: string;
    unreadCount?: number;
  };
}

export const ConversationUserItem = ({ f }: ConversationUserItemProps) => {
  const isUnread = !!f.unreadCount && f.unreadCount > 0;

  return (
    <>
      <Avatar name={f.name} image={f.image} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-sm truncate ${isUnread ? "font-bold text-white" : "font-semibold text-zinc-200"}`}
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {f.name}
          </span>
          {isUnread && (
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shrink-0" />
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          {f.lastMessage ? (
            <span
              className={`text-xs truncate ${isUnread ? "text-zinc-300 font-semibold" : "text-zinc-400"}`}
            >
              {f.lastMessage}
            </span>
          ) : (
            <span className="text-[10px] text-zinc-500 truncate font-mono">
              @{f.username}
            </span>
          )}
          <div className="flex items-center gap-2">
            {f.timestamp && (
              <span
                className={`text-[10px] shrink-0 font-mono ${isUnread ? "text-blue-400 font-bold" : "text-zinc-500"}`}
              >
                {formatTime(f.timestamp)}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
