import { create } from "zustand";
import { GetFriend } from "@/types/friends";
import { ChatMessage, ChatConversation, ChatUserInfo } from "@/types/chat";
import {
  addMessage,
  addUserToCache,
  clearChat,
  markChatAsRead,
  setInitialChatMessages,
} from "./inbox-store-actions";
import { immer } from "zustand/middleware/immer";

export interface InboxState {
  currentUser: ChatUserInfo | null;
  friends: Record<string, GetFriend>;
  conversations: Record<string, ChatConversation>;
  messagesMap: Record<string, ChatMessage[]>;
  usersCache: Record<string, ChatUserInfo>;
  latestMessages: Record<string, ChatMessage | null>;
  sidebarOrder: string[];
  unreadCounts: Record<string, number>;

  actions: {
    addUserToCache: (user: ChatUserInfo) => void;
    addMessage: (
      chatId: string,
      message: ChatMessage,
      sender?: { username: string; image: string | null; name: string },
    ) => void;
    setInitialChatMessages: (chatId: string, messages: ChatMessage[]) => void;
    markChatAsRead: (chatId: string) => void;
    clearChat: (chatId: string) => void;
  };
}

export type InboxStore = ReturnType<typeof createInboxStore>;

export const createInboxStore = (
  user: ChatUserInfo,
  conversationsList: ChatConversation[],
) => {
  const friends: Record<string, GetFriend> = {};
  const usersCache: Record<string, ChatUserInfo> = {};

  const conversations: Record<string, ChatConversation> = {};
  const latestMessages: Record<string, ChatMessage | null> = {};
  const unreadCounts: Record<string, number> = {};
  conversationsList.forEach((c) => {
    conversations[c.user.id] = c;
    latestMessages[c.user.id] = c.lastMessage;
    usersCache[c.user.id] = c.user;
    unreadCounts[c.user.id] = c.unreadCount || 0;
  });

  const enriched = conversationsList.map((c) => {
    return {
      ...c.user,
      timestamp: c.lastMessage?.createdAt
        ? new Date(c.lastMessage.createdAt).getTime()
        : 0,
    };
  });

  enriched.sort((a, b) => {
    if (a.timestamp && b.timestamp) return b.timestamp - a.timestamp;
    if (a.timestamp) return -1;
    if (b.timestamp) return 1;
    return a.username.localeCompare(b.username);
  });

  return create<InboxState>()(
    immer((set) => {
      return {
        currentUser: user,
        friends,
        conversations,
        usersCache,
        messagesMap: {},
        latestMessages,
        sidebarOrder: enriched.map((e) => e.id),
        unreadCounts,

        actions: {
          addMessage: (chatId, msg, sender) => {
            set((state) => addMessage(state, chatId, msg, sender));
          },
          addUserToCache: (user) => set((state) => addUserToCache(state, user)),

          setInitialChatMessages: (chatId, messages) => {
            set((state) => setInitialChatMessages(state, chatId, messages));
          },

          markChatAsRead: (chatId) => {
            set((state) => markChatAsRead(state, chatId));
          },

          clearChat: (chatId) => {
            set((state) => clearChat(state, chatId));
          },
        },
      };
    }),
  );
};
