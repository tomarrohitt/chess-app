"use client";

import { useMemo } from "react";
import { useInbox } from "./inbox-context";
import { ChatRedirectBtn } from "./chat-redirect-button";
import { ConversationUserItem } from "./conversation-user-item";

export const ConversationList = () => {
  const usersCache = useInbox((s) => s.usersCache);
  const sidebarOrder = useInbox((s) => s.sidebarOrder);
  const latestMessages = useInbox((s) => s.latestMessages);
  const unreadCounts = useInbox((s) => s.unreadCounts);

  const displayItems = useMemo(() => {
    const items = sidebarOrder
      .map((id) => {
        const user = usersCache[id];
        const lastMsg = latestMessages[id];

        if (!user || !lastMsg) return null;

        return {
          ...user,
          lastMessage: lastMsg.content,
          timestamp: lastMsg && lastMsg.createdAt,
          unreadCount: unreadCounts[id] || 0,
        };
      })
      .filter(Boolean);

    return items;
  }, [sidebarOrder, usersCache, latestMessages, unreadCounts]);

  return (
    <>
      {displayItems.map((f) => {
        if (!f) return;
        return (
          <ChatRedirectBtn fid={f.id} key={f.id}>
            <ConversationUserItem f={f} />
          </ChatRedirectBtn>
        );
      })}
    </>
  );
};
