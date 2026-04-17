"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { useStore } from "zustand";
import { ChatConversation } from "@/types/chat";
import {
  createInboxStore,
  InboxStore,
  InboxState,
} from "../../../../store/inbox-store";
import { User } from "@/types/auth";

const InboxContext = createContext<InboxStore | null>(null);

interface InboxProviderProps {
  user: User;
  conversations: ChatConversation[];
  children: ReactNode;
}

export function InboxProvider({
  user,
  conversations,
  children,
}: InboxProviderProps) {
  const [store] = useState(() =>
    createInboxStore(
      {
        name: user.name,
        id: user.id,
        image: user.image,
        username: user.username,
        isBlocked: false,
      },
      conversations,
    ),
  );
  return (
    <InboxContext.Provider value={store}>{children}</InboxContext.Provider>
  );
}

export function useInbox<T>(selector: (state: InboxState) => T): T {
  const ctx = useContext(InboxContext);
  if (!ctx) throw new Error("useInbox must be used within InboxProvider");
  return useStore(ctx, selector);
}
