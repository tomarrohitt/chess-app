"use server";

import { api } from "@/lib/clients/server";
import { safeFetch } from "@/lib/constants/safe-fetch";
import { GetFriend, SearchFriend } from "@/types/friends";
import { revalidatePath } from "next/cache";

export async function getFriends(): Promise<GetFriend[] | null> {
  const friends = await safeFetch<GetFriend[]>("/friends?limit=50");

  if (!friends?.length) return null;

  return friends;
}

export async function searchUsers(query: string) {
  const result = await safeFetch<SearchFriend[]>(`/friends/search?q=${query}`);

  if (!result?.length) return null;

  return result;
}
export async function getRequests() {
  const result = await safeFetch<SearchFriend[]>(`/friends/requests`);

  if (!result?.length) return null;
  return result;
}
export async function removeFriend(userId: string): Promise<boolean> {
  const res = await api(`/friends/remove`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },

    body: { userId },
  });

  if (!res?.ok) return false;
  revalidatePath("/community");

  return true;
}
export async function addFriend(userId: string): Promise<boolean> {
  const res = await api(`/friends/request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },

    body: { userId },
  });

  if (!res?.ok) return false;
  revalidatePath("/community");
  return true;
}
export async function acceptRequest(userId: string): Promise<boolean> {
  const res = await api(`/friends/accept`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },

    body: { userId },
  });

  if (!res?.ok) return false;
  revalidatePath("/community");
  return true;
}
export async function declineRequest(userId: string): Promise<boolean> {
  const res = await api(`/friends/decline`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },

    body: { userId },
  });

  if (!res?.ok) return false;
  revalidatePath("/community");
  return true;
}
