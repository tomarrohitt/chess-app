import { ShieldOff, Slash } from "lucide-react";
import { EmptyState } from "./community-shared";
import { PlayerCard } from "./player-card";
import { getBlocked, unblockUser } from "@/actions/friend";
import { IconBtn } from "./icon-btn";

export async function BlockedTab() {
  const blockUsers = await getBlocked();
  return (
    <div className="flex flex-col gap-4">
      {!blockUsers ? (
        <EmptyState
          icon={ShieldOff}
          title="No blocked players"
          sub="Players you block won't be able to send you messages or challenges."
        />
      ) : (
        <>
          <p
            className="text-xs text-zinc-500"
            style={{ fontFamily: "'Fira Code', monospace" }}
          >
            {blockUsers.length} block
          </p>
          <div className="flex flex-col gap-2">
            {blockUsers.map((b) => (
              <PlayerCard
                key={b.id}
                player={b}
                actions={
                  <IconBtn
                    icon={<Slash size="14" />}
                    label="Unblock"
                    variant="green"
                    onClick={unblockUser.bind(null, b.id)}
                  />
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
