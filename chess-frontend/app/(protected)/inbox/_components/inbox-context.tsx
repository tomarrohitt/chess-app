"use client";
import { createContext, useContext, useRef, ReactNode } from "react";
import { useStore } from "zustand";
import { User } from "@/types/auth";
import { ChatConversation } from "@/types/chat";
import {
  createInboxStore,
  InboxStore,
  InboxState,
} from "../../../../store/inbox-store";

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
  const storeRef = useRef<InboxStore>(undefined);
  if (!storeRef.current) {
    storeRef.current = createInboxStore(user, conversations);
  }
  return (
    <InboxContext.Provider value={storeRef.current}>
      {children}
    </InboxContext.Provider>
  );
}

export function useInbox<T>(selector: (state: InboxState) => T): T {
  const ctx = useContext(InboxContext);
  if (!ctx) throw new Error("useInbox must be used within InboxProvider");
  return useStore(ctx, selector);
}
