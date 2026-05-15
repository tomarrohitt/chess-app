"use client";
import { Avatar } from "../../_components/inbox-shared";
import { ChatUserInfo } from "@/types/chat";
import { OfferChallengeBtn } from "./offer-challenge-btn";
import { ClearChatButton } from "./clear-chat-btn";
import Link from "next/link";

interface InboxInfoProps {
  user: ChatUserInfo | null;
}

export function InboxInfo({ user }: InboxInfoProps) {
  if (!user) return null;

  return (
    <div
      className="w-72 flex flex-col rounded-2xl overflow-hidden shrink-0"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        className="p-6 flex flex-col items-center border-b border-white/10"
        style={{ background: "rgba(255,255,255,0.02)" }}
      >
        <Avatar name={user.name} image={user.image} size={80} />
        <Link
          href={`/profile/${user.id}`}
          className="mt-4 font-bold text-white text-lg text-center hover:underline underline-offset-4"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {user.name}
        </Link>
        <p className="text-sm text-zinc-400 font-mono mt-1">@{user.username}</p>
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1 overflow-y-auto min-h-0">
        {!user.isBlocked && <OfferChallengeBtn id={user.id} />}
        <ClearChatButton id={user.id} />
      </div>
    </div>
  );
}
