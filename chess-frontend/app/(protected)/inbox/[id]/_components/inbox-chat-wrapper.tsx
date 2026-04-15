"use client";
import { InboxInfo } from "./inbox-info";
import { ChatMessage, ChatMessageSchemaResponse } from "@/types/chat";
import { InboxChatHeader } from "./inbox-chat-header";
import { InboxChatList } from "./inbox-chat-list";
import { InboxChatInput } from "./inbox-chat-input";
import { ShowInfoBtn } from "./show-info-btn";
import { ScrollRef } from "./scroll-ref";
import { OfferChallengeBtn } from "./offer-challenge-btn";

interface Props {
  chatId: string;
  history: ChatMessageSchemaResponse | null;
}

export function InboxChatWrapper({ chatId, history }: Props) {
  const initialMessages = history?.messages ?? [];

  const activeData = history && history.user;

  return (
    
  );
}
