import { getChatHistory } from "@/actions/chat";
import { InboxChatHeader } from "./_components/inbox-chat-header";
import { ShowInfoBtn } from "./_components/show-info-btn";
import { InboxChatList } from "./_components/inbox-chat-list";
import { ScrollRef } from "./_components/scroll-ref";
import { InboxChatInput } from "./_components/inbox-chat-input";
import { InboxInfo } from "./_components/inbox-info";
import { OfferChallengeBtn } from "./_components/offer-challenge-btn";
import { getUserFromSession } from "@/actions/session";
import { SyncEffects } from "./_components/sync-effects";

export default async function InboxIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [currentUser, history] = await Promise.all([
    getUserFromSession(),
    getChatHistory(id),
  ]);

  if (!history || !currentUser) return;

  const { user, messages } = history;

  return (
    <>
      <div
        className="flex-1 flex flex-col rounded-2xl h-[calc(100vh-90px)] overflow-y-auto"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <InboxChatHeader activeData={user}>
          <ShowInfoBtn />
        </InboxChatHeader>

        <InboxChatList
          currentUser={currentUser}
          chatId={id}
          initialMessages={messages}
        >
          <ScrollRef chatId={id} />
        </InboxChatList>
        <InboxChatInput currentUserId={currentUser.id} chatId={id} />
      </div>
      {/* <InboxInfo activeData={user}>
        <OfferChallengeBtn id={user.id} />
      </InboxInfo> */}
      <SyncEffects
        chatId={id}
        currentUserId={currentUser.id}
        initialMessages={messages}
      />
    </>
  );
}
