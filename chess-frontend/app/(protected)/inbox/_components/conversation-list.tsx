"use client";

import { useMemo } from "react";
import { useInbox } from "./inbox-context";
import { ChatRedirectBtn } from "./chat-redirect-button";
import { ConversationUserItem } from "./conversation-user-item";
import { ClearChatButton } from "./clear-chat-btn";

export const ConversationList = () => {
  const usersCache = useInbox((s) => s.usersCache);
  const sidebarOrder = useInbox((s) => s.sidebarOrder);
  const latestMessages = useInbox((s) => s.latestMessages);

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
        };
      })
      .filter(Boolean);

    return items;
  }, [sidebarOrder, usersCache, latestMessages]);

  return (
    <>
      {displayItems.map((f) => {
        if (!f) return;
        return (
          <ChatRedirectBtn fid={f.id} key={f.id}>
            <ConversationUserItem f={f}>
              <ClearChatButton id={f.id} />
            </ConversationUserItem>
          </ChatRedirectBtn>
        );
      })}
    </>
  );
};
