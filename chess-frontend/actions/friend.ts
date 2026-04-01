"use server";

import { safeFetch } from "@/lib/constants/safe-fetch";
import { GetFriend, SearchFriend } from "@/types/friends";

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
