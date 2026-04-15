"use client";

import { MessageSquare } from "lucide-react";
import { IconBtn } from "./icon-btn";
import { useRouter } from "next/navigation";

export function MessageButton({ targetId }: { targetId: string }) {
  const router = useRouter();

  return (
    <IconBtn
      icon={<MessageSquare size="14" />}
      label="Message"
      variant="blue"
      onClick={async () => {
        router.push(`/inbox/${targetId}`);
        return true;
      }}
    />
  );
}
