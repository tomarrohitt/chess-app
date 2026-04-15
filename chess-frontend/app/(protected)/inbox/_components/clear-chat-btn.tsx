import { clearConversations } from "@/actions/chat";
import { Loader, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { useInbox } from "./inbox-context";
import { useRouter } from "next/navigation";

export const ClearChatButton = ({ id }: { id: string }) => {
  const [pending, startTransition] = useTransition();
  const clearChat = useInbox((s) => s.clearChat);

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
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-red-500/20 text-zinc-500 hover:text-red-400 shrink-0"
      onClick={handleClearChat}
      disabled={pending}
    >
      {pending ? (
        <Loader size={14} className="animate-spin" />
      ) : (
        <Trash2 size={14} />
      )}
    </button>
  );
};
