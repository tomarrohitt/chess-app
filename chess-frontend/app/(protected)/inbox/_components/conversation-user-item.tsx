import { Avatar, formatTime } from "./inbox-shared";

interface ConversationUserItemProps {
  f: {
    lastMessage: string;
    timestamp: string | Date;
    id: string;
    username: string;
    image: string | null;
    name: string;
  };
  children: React.ReactNode;
}

export const ConversationUserItem = ({
  f,
  children,
}: ConversationUserItemProps) => {
  return (
    <>
      <Avatar name={f.name} image={f.image} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className="font-semibold text-sm text-white truncate"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {f.name}
          </span>
          {children}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          {f.lastMessage ? (
            <span className="text-xs text-zinc-400 truncate">
              {f.lastMessage}
            </span>
          ) : (
            <span className="text-[10px] text-zinc-500 truncate font-mono">
              @{f.username}
            </span>
          )}
          <div className="flex items-center gap-2">
            {f.timestamp && (
              <span className="text-[10px] text-zinc-500 shrink-0 font-mono">
                {formatTime(f.timestamp)}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
