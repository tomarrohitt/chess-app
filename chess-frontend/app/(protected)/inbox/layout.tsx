import { getUserFromSession } from "@/actions/session";
import { redirect } from "next/navigation";
import { getAvailableFriends, getRecentConversations } from "@/actions/chat";
import { InboxProvider } from "./_components/inbox-context";
import { InboxSocketListener } from "./_components/inbox-socket-listener";
import { InboxSidebar } from "./_components/inbox-sidebar";
import { ConversationList } from "./_components/conversation-list";
import { SearchConversation } from "./_components/search-conversation";

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

  const [friends, conversations] = await Promise.all([
    getAvailableFriends(),
    getRecentConversations(),
  ]);

  return (
    <InboxProvider user={user} conversations={conversations}>
      <InboxSocketListener />
      <div className="flex-1 max-w-6xl w-full mx-auto flex gap-x-2 h-[calc(100vh-100px)] py-2 px-4">
        <InboxSidebar content={<SearchConversation friends={friends} />}>
          <ConversationList />
        </InboxSidebar>
        {children}
      </div>
    </InboxProvider>
  );
}
