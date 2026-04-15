"use client";

import { useEffect } from "react";
import { useInbox } from "./inbox-context";
import { ChatMessage } from "@/types/chat";
import { fetchUserById } from "@/actions/auth";

export function InboxSocketListener() {
  const addMessage = useInbox((s) => s.addMessage);
  const currentUser = useInbox((s) => s.currentUser);
  const usersCache = useInbox((s) => s.usersCache);
  const addUserToCache = useInbox((s) => s.addUserToCache);

  useEffect(() => {
    const handleMessage = (e: CustomEvent) => {
      const msg = e.detail as ChatMessage;

      const otherUserId =
        msg.senderId === currentUser?.id ? msg.receiverId : msg.senderId;

      addMessage(otherUserId, msg);

      if (!usersCache[otherUserId]) {
        fetchUserById(otherUserId).then((user) => {
          if (user) addUserToCache(user);
        });
      }
    };

    window.addEventListener("chat_message", handleMessage as EventListener);
    return () =>
      window.removeEventListener(
        "chat_message",
        handleMessage as EventListener,
      );
  }, [currentUser?.id, addMessage]);

  return null;
}
