import { User } from "@/types/auth";
import { InboxChatHeader } from "./inbox-chat-header";
import { InboxChatList } from "./inbox-chat-list";
import { InboxChatInput } from "./inbox-chat-input";
import { ChatMessage, ChatUserInfo } from "@/types/chat";

interface InboxChatProps {
  activeData: ChatUserInfo | null;
  activeMessages: ChatMessage[];
  currentUser: User;
  showInfo: boolean;
  setShowInfo: React.Dispatch<React.SetStateAction<boolean>>;
  message: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSendMessage: (e: React.SubmitEvent) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export function InboxChat({
  activeData,
  activeMessages,
  currentUser,
  showInfo,
  setShowInfo,
  message,
  handleInputChange,
  handleSendMessage,
  messagesEndRef,
}: InboxChatProps) {
  return (
    
  );
}
