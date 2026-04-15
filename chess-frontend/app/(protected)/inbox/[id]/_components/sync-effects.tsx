"use client";

import { useEffect } from "react";
import { useInbox } from "../../_components/inbox-context";
import { ChatMessage } from "@/types/chat";

export const SyncEffects = ({
  chatId,
  currentUserId,
  initialMessages,
}: {
  chatId: string;
  currentUserId: string;
  initialMessages: ChatMessage[];
}) => {
  const setInitialChatMessages = useInbox((s) => s.setInitialChatMessages);
  const markChatAsRead = useInbox((s) => s.markChatAsRead);

  useEffect(() => {
    if (initialMessages.length) {
      setInitialChatMessages(chatId, initialMessages);
    }
  }, [chatId, initialMessages]);

  useEffect(() => {
    if (currentUserId) {
      markChatAsRead(chatId, currentUserId);
    }
  }, [chatId, currentUserId]);

  return null;
};
