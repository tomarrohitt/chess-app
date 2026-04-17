"use client";
import { useEffect, useRef } from "react";
import { useInbox } from "../../_components/inbox-context";

export const ScrollRef = ({ otherUserId }: { otherUserId: string }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messages = useInbox((s) => s.messagesMap[otherUserId]) ?? [];
  const isInitial = useRef(true);

  useEffect(() => {
    isInitial.current = true;
  }, [otherUserId]);

  useEffect(() => {
    if (messages.length === 0) return;
    const behavior = isInitial.current ? "instant" : "smooth";
    isInitial.current = false;
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, [messages.length]);

  return <div ref={messagesEndRef} />;
};
