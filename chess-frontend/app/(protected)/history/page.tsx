import { api } from "@/lib/clients/server";
import { GameBoardWithHistory } from "./_components/game-history-with-board";
import { ApiResponse } from "@/types";
import { GameRecord } from "@/types/history";

async function getHistory() {
  try {
    const res = await api("/games/history?limit=50");

    if (!res.ok) return null;

    const { data }: ApiResponse<GameRecord[]> = await res.json();

    if (!data?.length) return null;

    return data;
  } catch (error) {
    console.error("Fetch failed:", error);
    return null;
  }
}

const HistoryPage = async () => {
  const games = await getHistory();
  if (!games) return null;

  return <GameBoardWithHistory games={games} />;
};

export default HistoryPage;
