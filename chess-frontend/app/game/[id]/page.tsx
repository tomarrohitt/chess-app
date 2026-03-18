import { getUserFromSession } from "@/actions/session";
import { redirect } from "next/navigation";
import { Gameboard } from "./_components/gameboard";
import { api } from "@/lib/clients/server";
import { ArchiveBoard } from "./_components/archive-board";

export default async function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  const { id } = await params;

  let initialGameData = null;

  try {
    const res = await api(`/games/${id}`);
    const json = await res.json();
    if (json.success) {
      initialGameData = json.data;
    }
  } catch (error) {
    console.log({ error });
  }

  if (initialGameData) {
    return <ArchiveBoard gameData={initialGameData} user={user} />;
  }

  return <Gameboard gameId={id} user={user} />;
}
