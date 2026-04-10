import { Suspense } from "react";
import { Swords, MessageSquare, UserMinus, Users, UserX } from "lucide-react";
import { EmptyState, FriendCard, PlayerListSkeleton } from "./community-shared";
import { blockUser, getFriends, removeFriend } from "@/actions/friend";
import { SearchUsersForm } from "./search-users-form";
import { IconBtn } from "./icon-btn";
import { InfiniteScrollList } from "./infinite-scroll-list";
import { ChallengeButton } from "./challenge-btn";
import { MessageButton } from "./message-btn";

export function FriendsTab({ query }: { query: string }) {
  return (
    <div className="flex flex-col gap-4">
      <SearchUsersForm query={query} placeholder="Find friend" />
      <Suspense key={query} fallback={<PlayerListSkeleton />}>
        <FriendsResults query={query} />
      </Suspense>
    </div>
  );
}

async function FriendsResults({ query }: { query: string }) {
  const friends = await getFriends();

  const filtered =
    query && friends
      ? friends.filter(
          (f) =>
            f.name.toLowerCase().includes(query.toLowerCase()) ||
            f.username.toLowerCase().includes(query.toLowerCase()),
        )
      : friends;

  if (!filtered || filtered.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title={query ? "No friends found" : "No friends yet"}
        sub={
          query
            ? `No friends match "${query}".`
            : "Search for players and send friend requests to get started."
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <InfiniteScrollList>
        {filtered.map((f) => (
          <FriendCard
            key={f.id}
            player={f}
            actions={
              <>
                <ChallengeButton targetId={f.id} />
                <MessageButton targetId={f.id} />
                <IconBtn
                  icon={<UserMinus size="14" />}
                  label="Remove friend"
                  variant="rose"
                  onClick={removeFriend.bind(null, f.id)}
                />
                <IconBtn
                  icon={<UserX size="14" />}
                  label="Block"
                  variant="red"
                  onClick={blockUser.bind(null, f.id)}
                />
              </>
            }
          />
        ))}
      </InfiniteScrollList>
    </div>
  );
}
