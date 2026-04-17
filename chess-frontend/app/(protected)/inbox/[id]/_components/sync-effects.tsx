"use client";

import { useEffect } from "react";
import { useInbox } from "../../_components/inbox-context";
import { ChatMessage } from "@/types/chat";

export const SyncEffects = ({
  otherUserId,
  currentUserId,
  initialMessages,
}: {
  otherUserId: string;
  currentUserId: string;
  initialMessages: ChatMessage[];
}) => {
  const setInitialChatMessages = useInbox((s) => s.setInitialChatMessages);
  const markChatAsRead = useInbox((s) => s.markChatAsRead);

  useEffect(() => {
    if (initialMessages.length) {
      setInitialChatMessages(otherUserId, initialMessages);
    }
  }, [otherUserId, initialMessages, setInitialChatMessages]);

  useEffect(() => {
    if (currentUserId) {
      markChatAsRead(otherUserId);
    }
  }, [otherUserId, currentUserId, markChatAsRead]);

  return null;
};
