import { ConversationList } from "./conversation-list";
import { InboxSidebar } from "./inbox-sidebar";
import { InboxSocketListener } from "./inbox-socket-listener";

interface Props {
  children: React.ReactNode;
}

export function InboxLayoutClient({ children }: Props) {
  return (
    <>
      <InboxSocketListener />
      <div className="flex-1 max-w-6xl w-full mx-auto flex gap-4 h-[calc(100vh-100px)] py-6 px-4">
        <InboxSidebar>
          <ConversationList />
        </InboxSidebar>
        {children}
      </div>
    </>
  );
}
