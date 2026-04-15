"use server";

import { api } from "@/lib/clients/server";
import { safeFetch } from "@/lib/constants/safe-fetch";
import { ChatConversation, ChatMessageSchemaResponse } from "@/types/chat";

export async function getChatHistory(userId: string) {
  const result = await safeFetch<ChatMessageSchemaResponse>(
    `/chat/history/${userId}`,
  );
  return result;
}

export async function getRecentConversations() {
  const result = await safeFetch<ChatConversation[]>(`/chat/conversations`);
  if (!result) return [];
  return result;
}

export async function clearConversations(userId: string) {
  const res = await api(`/chat/history/${userId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!res?.ok) return false;
}
