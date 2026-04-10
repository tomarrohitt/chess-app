"use server";

import { safeFetch } from "@/lib/constants/safe-fetch";

export async function getChatHistory(userId: string) {
  const result = await safeFetch<[any]>(`/chat/history/${userId}`);
  if (!result?.length) return null;

  return result;
}

export async function getRecentConversations() {
  const result = await safeFetch<[any]>(`/chat/conversations`);
  if (!result?.length) return null;
  return result;
}
