import { acceptRequest, declineRequest, getRequests } from "@/actions/friend";
import { EmptyState } from "./community-shared";
import { Bell, Check, X } from "lucide-react";
import { IconBtn } from "./icon-btn";
import { PlayerCard } from "./player-card";

export async function RequestsTab() {
  const friends = await getRequests();

  return (
    <div className="flex flex-col gap-4">
      {!friends ? (
        <EmptyState
          icon={Bell}
          title="No pending friends"
          sub="When someone sends you a friend request, it'll show up here."
        />
      ) : (
        <>
          <p
            className="text-xs text-zinc-500"
            style={{ fontFamily: "'Fira Code', monospace" }}
          >
            {friends.length} pending
          </p>
          <div className="flex flex-col gap-2">
            {friends.map((r) => (
              <PlayerCard
                key={r.id}
                player={r}
                actions={
                  <>
                    <IconBtn
                      icon={<Check size="14" />}
                      label="Accept"
                      variant="green"
                      onClick={acceptRequest.bind(null, r.id)}
                    />
                    <IconBtn
                      icon={<X size="14" />}
                      label="Decline"
                      variant="red"
                      onClick={declineRequest.bind(null, r.id)}
                    />
                  </>
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
