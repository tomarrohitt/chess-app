import { getUserFromSession } from "@/actions/session";
import { LobbyClient } from "@/components/game/lobby-client";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login");
  return <LobbyClient user={user} />;
}