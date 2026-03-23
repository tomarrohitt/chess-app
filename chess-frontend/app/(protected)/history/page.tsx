import { api } from "@/lib/clients/server";
import { GameBoardWithHistory } from "./_components/game-history-with-board";

const HistoryPage = async () => {
  const res = await api("/games/history?limit=50");
  const json = await res.json();
  const games = json.success ? json.data : null;
  return <GameBoardWithHistory games={games} />;
};

export default HistoryPage;
