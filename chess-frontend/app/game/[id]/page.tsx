import { getUserFromSession } from "@/actions/session";
import { redirect } from "next/navigation";
import { Gameboard } from "./_components/gameboard";

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await getUserFromSession();
    if (!user) redirect("/login");

    return <Gameboard gameId={id} user={user} />;
}