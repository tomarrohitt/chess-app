import { getUserFromSession } from "@/actions/session";
import { redirect } from "next/navigation";
import { InboxClient } from "../community/_components/inbox-client";
import { getFriends } from "@/actions/friend";
import { getRecentConversations } from "@/actions/chat";

export const metadata = {
  title: "Inbox",
};

export default async function InboxPage({
  searchParams,
}: {
  searchParams: { userId?: string };
}) {
  const user = await getUserFromSession();
  if (!user) {
    redirect("/login");
  }

  const [friends, conversations] = await Promise.all([
    getFriends(),
    getRecentConversations(),
  ]);

  return (
    <InboxClient
      currentUser={user}
      initialUserId={searchParams.userId}
      friends={friends || []}
      conversations={conversations || []}
    />
  );
}
