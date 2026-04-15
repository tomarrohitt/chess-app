function formatSeparatorDate(dateString: string) {
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

export const InboxChatItem = () => {
  return (
    <div key={msg.id} className="flex flex-col w-full">
      {showTimeSeparator && (
        <div className="flex justify-center my-4">
          <span
            className="text-[10px] text-zinc-500 font-semibold bg-white/5 px-3 py-1 rounded-full tracking-wider"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {formatSeparatorDate(msg.createdAt as string)}
          </span>
        </div>
      )}
      <div
        className={`flex flex-col max-w-[75%] ${isMe ? "self-end items-end" : "self-start items-start"} ${marginTop}`}
      >
        <div
          className={`px-4 py-2.5 text-sm rounded-2xl ${isMe ? `bg-blue-600 text-white ${isLastInGroup ? "rounded-br-sm" : ""}` : `bg-zinc-800 text-zinc-200 ${isLastInGroup ? "rounded-bl-sm" : ""}`}`}
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
};
