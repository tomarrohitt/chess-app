"use client";

import { memo } from "react";
import { useInbox } from "./inbox-context";
import { ChatRedirectBtn } from "./chat-redirect-button";
import { ConversationUserItem } from "./conversation-user-item";

const ConnectedConversationItem = memo(function ConnectedConversationItem({
  fid,
}: {
  fid: string;
}) {
  const user = useInbox((s) => s.usersCache[fid]);
  const lastMsg = useInbox((s) => s.latestMessages[fid]);
  const unreadCount = useInbox((s) => s.unreadCounts[fid]);

  if (!user || !lastMsg) return null;

  const f = {
    ...user,
    lastMessage: lastMsg.content,
    timestamp: lastMsg.createdAt,
    unreadCount: unreadCount || 0,
  };

  return (
    <ChatRedirectBtn fid={fid}>
      <ConversationUserItem f={f} />
    </ChatRedirectBtn>
  );
});

export const ConversationList = () => {
  const sidebarOrder = useInbox((s) => s.sidebarOrder);

  return (
    <>
      {sidebarOrder.map((id) => (
        <ConnectedConversationItem fid={id} key={id} />
      ))}
    </>
  );
};
