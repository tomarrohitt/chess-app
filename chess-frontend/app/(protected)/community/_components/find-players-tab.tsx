import { Suspense } from "react";
import { EmptyState, PlayerListSkeleton } from "./community-shared";
import {
  acceptRequest,
  addFriend,
  blockUser,
  declineRequest,
  searchUsers,
  cancelRequest,
} from "@/actions/friend";
import { SearchUsersForm } from "./search-users-form";
import {
  Search,
  Swords,
  UserPlus,
  UserX,
  UserCheck,
  Check,
  X,
} from "lucide-react";
import { IconBtn } from "./icon-btn";
import { PlayerCard } from "./player-card";
import { InfiniteScrollList } from "./infinite-scroll-list";
import { getUserFromSession } from "@/actions/session";

export function FindPlayersTab({ query }: { query: string }) {
  return (
    <div className="flex flex-col gap-4">
      <SearchUsersForm query={query} placeholder="Type the name or username" />
      {!query ? (
        <div className="text-center py-10 text-zinc-500">
          Type a name or username to search all players.
        </div>
      ) : (
        <Suspense key={query} fallback={<PlayerListSkeleton />}>
          <FindPlayersResults query={query} />
        </Suspense>
      )}
    </div>
  );
}

async function FindPlayersResults({ query }: { query: string }) {
  const results = await searchUsers(query);
  const user = await getUserFromSession();

  if (!results || results.length === 0) {
    return (
      <EmptyState
        icon={Search}
        title="No results found"
        sub={`No users match "${query}". Try a different name or username.`}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <InfiniteScrollList>
        {results.map((p) => {
          const isFriend = p.friendStatus === "ACCEPTED";
          const isPending = p.friendStatus === "PENDING";
          const iSentRequest = p.friendSenderId === user?.id;

          return (
            <PlayerCard
              key={p.id}
              player={p}
              actions={
                <>
                  <IconBtn
                    icon={<Swords size="14" />}
                    label="Challenge"
                    variant="amber"
                  />
                  {!isFriend && !isPending && (
                    <IconBtn
                      onClick={addFriend.bind(null, p.id)}
                      icon={<UserPlus size="14" />}
                      label="Add friend"
                      variant="green"
                    />
                  )}
                  {isPending && iSentRequest && (
                    <IconBtn
                      onClick={cancelRequest.bind(null, p.id)}
                      icon={<UserCheck size="14" />}
                      label="Request sent"
                    />
                  )}
                  {isPending && !iSentRequest && (
                    <>
                      <IconBtn
                        onClick={acceptRequest.bind(null, p.id)}
                        icon={<Check size="14" />}
                        label="Accept"
                        variant="green"
                      />
                      <IconBtn
                        onClick={declineRequest.bind(null, p.id)}
                        icon={<X size="14" />}
                        label="Decline"
                        variant="red"
                      />
                    </>
                  )}
                  <IconBtn
                    icon={<UserX size="14" />}
                    label="Block"
                    variant="red"
                    onClick={blockUser.bind(null, p.id)}
                  />
                </>
              }
            />
          );
        })}
      </InfiniteScrollList>
    </div>
  );
}
