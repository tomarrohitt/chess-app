import { createStore } from "zustand";
import { User } from "@/types/auth";
import { GetFriend } from "@/types/friends";
import { ChatMessage, ChatConversation, ChatUserInfo } from "@/types/chat";

export interface InboxState {
  currentUser: User | null;
  friends: Record<string, GetFriend>;
  conversations: Record<string, ChatConversation>;
  messagesMap: Record<string, ChatMessage[]>;
  usersCache: Record<string, ChatUserInfo>;
  addUserToCache: (user: ChatUserInfo) => void;
  latestMessages: Record<string, ChatMessage | null>;
  sidebarOrder: string[];

  addMessage: (
    chatId: string,
    message: ChatMessage,
    sender?: { username: string; image: string | null; name: string },
  ) => void;
  setInitialChatMessages: (chatId: string, messages: ChatMessage[]) => void;
  markChatAsRead: (chatId: string, currentUserId: string) => void;
  clearChat: (chatId: string) => void;
}

export type InboxStore = ReturnType<typeof createInboxStore>;

export const createInboxStore = (
  user: User,
  conversationsList: ChatConversation[],
) => {
  const friends: Record<string, GetFriend> = {};
  const usersCache: Record<string, ChatUserInfo> = {};

  const conversations: Record<string, ChatConversation> = {};
  const latestMessages: Record<string, ChatMessage | null> = {};
  conversationsList.forEach((c) => {
    conversations[c.user.id] = c;
    latestMessages[c.user.id] = c.lastMessage;
    usersCache[c.user.id] = c.user;
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

  return createStore<InboxState>()((set) => ({
    currentUser: user,
    friends,
    conversations,
    usersCache,
    messagesMap: {},
    latestMessages,
    sidebarOrder: enriched.map((e) => e.id),

    addMessage: (chatId, msg, sender) => {
      set((state) => {
        const existing = state.messagesMap[chatId] ?? [];
        if (existing.some((m) => m.id === msg.id)) return state;

        const senderId = msg.senderId;
        const isMe = state.currentUser?.id === senderId;

        const base = isMe
          ? existing.filter(
              (m) => !(m.id.startsWith("temp-") && m.content === msg.content),
            )
          : existing;

        const updatedChat = [...base, msg].sort(
          (a, b) =>
            new Date(a.createdAt as string).getTime() -
            new Date(b.createdAt as string).getTime(),
        );

        const filteredOrder = state.sidebarOrder.filter((id) => id !== chatId);
        const newOrder = [chatId, ...filteredOrder];

        let newUsersCache = state.usersCache;
        if (!isMe && msg.senderId && !state.usersCache[chatId] && sender) {
          newUsersCache = {
            ...state.usersCache,
            [chatId]: {
              id: msg.senderId,
              username: sender.username,
              name: sender.name,
              image: sender.image,
            },
          };
        }

        return {
          messagesMap: { ...state.messagesMap, [chatId]: updatedChat },
          latestMessages: {
            ...state.latestMessages,
            [chatId]: updatedChat[updatedChat.length - 1],
          },
          sidebarOrder: newOrder,
          usersCache: newUsersCache,
        };
      });
    },
    addUserToCache: (user) =>
      set((state) => ({
        usersCache: { ...state.usersCache, [user.id]: user },
      })),

    setInitialChatMessages: (chatId, messages) => {
      set((state) => {
        if (state.messagesMap[chatId]?.length) return state;

        const wasCleared =
          state.messagesMap[chatId] !== undefined &&
          state.messagesMap[chatId].length === 0 &&
          state.latestMessages[chatId] === null;
        if (wasCleared) return state;

        const latest =
          messages.length > 0
            ? messages[messages.length - 1]
            : (state.latestMessages[chatId] ?? null);
        return {
          messagesMap: { ...state.messagesMap, [chatId]: messages },
          latestMessages: { ...state.latestMessages, [chatId]: latest },
        };
      });
    },

    markChatAsRead: (chatId, currentUserId) => {
      set((state) => {
        const chat = state.messagesMap[chatId];
        if (!chat) return state;

        const hasUnread = chat.some(
          (m) => !m.read && m.senderId !== currentUserId,
        );

        if (!hasUnread) return state;

        return {
          messagesMap: {
            ...state.messagesMap,
            [chatId]: chat.map((m) => ({ ...m, read: true })),
          },
        };
      });
    },

    clearChat: (chatId) => {
      set((state) => ({
        messagesMap: { ...state.messagesMap, [chatId]: [] },
        latestMessages: { ...state.latestMessages, [chatId]: null },
        sidebarOrder: state.sidebarOrder.filter((id) => id !== chatId), // 👈
      }));
    },
  }));
};
