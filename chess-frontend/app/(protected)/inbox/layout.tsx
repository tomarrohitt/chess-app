import { getUserFromSession } from "@/actions/session";
import { redirect } from "next/navigation";
import { getRecentConversations } from "@/actions/chat";
import { InboxLayoutClient } from "./_components/inbox-layout-client";
import { InboxProvider } from "./_components/inbox-context";

export const metadata = {
  title: "Inbox",
};

export default async function InboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserFromSession();
  if (!user) {
    redirect("/login");
  }

  const conversations = await getRecentConversations();

  return (
    <InboxProvider user={user} conversations={conversations}>
      <InboxLayoutClient>{children}</InboxLayoutClient>
    </InboxProvider>
  );
}
