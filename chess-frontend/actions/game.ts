"use server";

import { safeFetch } from "@/lib/constants/safe-fetch";
import { GameRecord } from "@/types/history";

export async function getRecentGames(id: string): Promise<GameRecord[] | null> {
  try {
    const res = safeFetch<GameRecord[]>(`/games/history/${id}?limit=20`);
    return res;
  } catch {
    return null;
  }
}
