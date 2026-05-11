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
  const { setInitialChatMessages, markChatAsRead } = useInbox((s) => s.actions);

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
