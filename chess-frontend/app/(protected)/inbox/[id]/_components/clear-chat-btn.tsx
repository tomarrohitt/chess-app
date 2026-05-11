import { clearConversations } from "@/actions/chat";
import { Loader, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useInbox } from "../../_components/inbox-context";

export const ClearChatButton = ({ id }: { id: string }) => {
  const [pending, startTransition] = useTransition();
  const { clearChat } = useInbox((s) => s.actions);

  const router = useRouter();

  const handleClearChat = () => {
    startTransition(async () => {
      await clearConversations(id);
      clearChat(id);
      router.push("/inbox");
    });
  };
  return (
    <button
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 transition-colors text-red-500 text-sm font-medium w-full text-left cursor-pointer"
      onClick={handleClearChat}
      disabled={pending}
    >
      {pending ? (
        <Loader size={16} className="animate-spin" />
      ) : (
        <>
          <Trash2 size={16} /> Clear Chat
        </>
      )}
    </button>
  );
};
