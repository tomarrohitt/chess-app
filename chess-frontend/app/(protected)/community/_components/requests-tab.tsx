"use client";

import * as React from "react";
import { Bell, Check, X } from "lucide-react";
import { STUB_REQUESTS } from "./community-types";
import { EmptyState, PlayerCard, IconBtn } from "./community-shared";

export function RequestsTab() {
  const [requests, setRequests] = React.useState(STUB_REQUESTS);

  const accept = (id: string) =>
    setRequests((p) => p.filter((r) => r.id !== id));
  const decline = (id: string) =>
    setRequests((p) => p.filter((r) => r.id !== id));

  return (
    <div className="flex flex-col gap-4">
      {requests.length === 0 ? (
        // <EmptyState
        //   icon={Bell}
        //   title="No pending requests"
        //   sub="When someone sends you a friend request, it'll show up here."
        // />
        <div></div>
      ) : (
        <>
          <p
            className="text-xs text-zinc-500"
            style={{ fontFamily: "'Fira Code', monospace" }}
          >
            {requests.length} pending
          </p>
          <div className="flex flex-col gap-2">
            {/* {requests.map((r) => (
              <PlayerCard
                key={r.id}
                player={r}
                actions={
                  <>
                    <IconBtn
                      icon={Check}
                      label="Accept"
                      variant="green"
                      onClick={() => accept(r.id)}
                    />
                    <IconBtn
                      icon={X}
                      label="Decline"
                      variant="red"
                      onClick={() => decline(r.id)}
                    />
                  </>
                }
              />
            ))} */}
          </div>
        </>
      )}
    </div>
  );
}
