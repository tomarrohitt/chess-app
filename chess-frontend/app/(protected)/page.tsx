import { getUserFromSession } from "@/actions/session";
import { LobbyClient } from "@/components/game/lobby-client";
import { GameHistory } from "@/app/(protected)/_components/game-history";
import { api } from "@/lib/clients/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  const res = await api("/games/history?limit=20");
  const json = await res.json();
  const games = json.success ? json.data : null;

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
