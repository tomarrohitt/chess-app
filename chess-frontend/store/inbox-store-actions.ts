import { ChatMessage, ChatUserInfo } from "@/types/chat";
import { InboxState } from "./inbox-store";

type StoreUser = { username: string; image: string | null; name: string };

export const addMessage = (
  state: InboxState,
  chatId: string,
  msg: ChatMessage,
  sender?: StoreUser,
) => {
  const existing = state.messagesMap[chatId] ?? [];
  if (existing.some((m) => m.id === msg.id)) return;

  const senderId = msg.senderId;
  const isMe = state.currentUser?.id === senderId;

  if (isMe) {
    state.messagesMap[chatId] = existing.filter(
      (m) => !(m.id.startsWith("temp-") && m.content === msg.content),
    );
  } else {
    state.messagesMap[chatId] = existing;
  }

  state.messagesMap[chatId].push(msg);
  state.messagesMap[chatId].sort(
    (a, b) =>
      new Date(a.createdAt as string).getTime() -
      new Date(b.createdAt as string).getTime(),
  );

  const sorted = state.messagesMap[chatId];
  state.latestMessages[chatId] = sorted[sorted.length - 1];

  state.sidebarOrder = [
    chatId,
    ...state.sidebarOrder.filter((id) => id !== chatId),
  ];

  if (!isMe && msg.senderId && !state.usersCache[chatId] && sender) {
    state.usersCache[chatId] = {
      id: msg.senderId,
      username: sender.username,
      name: sender.name,
      image: sender.image,
      isBlocked: false,
    };
  }

  if (!isMe) {
    state.unreadCounts[chatId] = (state.unreadCounts[chatId] || 0) + 1;
  }
};

export const addUserToCache = (state: InboxState, user: ChatUserInfo) => {
  state.usersCache[user.id] = user;
};

export const setInitialChatMessages = (
  state: InboxState,
  chatId: string,
  messages: ChatMessage[],
) => {
  if (state.messagesMap[chatId]?.length) return;

  const wasCleared =
    state.messagesMap[chatId] !== undefined &&
    state.messagesMap[chatId].length === 0 &&
    state.latestMessages[chatId] === null;
  if (wasCleared) return;

  state.messagesMap[chatId] = messages;
  state.latestMessages[chatId] =
    messages.length > 0
      ? messages[messages.length - 1]
      : (state.latestMessages[chatId] ?? null);
};

export const markChatAsRead = (state: InboxState, chatId: string) => {
  state.unreadCounts[chatId] = 0;
};

export const clearChat = (state: InboxState, chatId: string) => {
  state.messagesMap[chatId] = [];
  state.latestMessages[chatId] = null;
  state.sidebarOrder = state.sidebarOrder.filter((id) => id !== chatId);
  state.unreadCounts[chatId] = 0;
};
