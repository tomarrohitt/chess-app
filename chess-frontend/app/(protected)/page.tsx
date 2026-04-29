import { getUserFromSession } from "@/actions/session";
import { LobbyClient } from "@/components/game/lobby-client";
import { GameHistory } from "@/app/(protected)/_components/game-history";
import { redirect } from "next/navigation";
import { getRecentGames } from "@/actions/game";

export default async function HomePage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  const games = await getRecentGames(user.id);

  return (
    <main className="flex-1 flex flex-col lg:flex-row max-w-6xl mx-auto w-full gap-10 pt-6">
      <div className="flex-1">
        <LobbyClient />
      </div>
      <div className="w-full lg:w-96 shrink-0">
        <GameHistory games={games} currentUserId={user.id} />
      </div>
    </main>
  );
}
