import { Suspense } from "react";
import { Swords, MessageSquare, UserMinus, Users } from "lucide-react";
import { EmptyState, FriendCard, PlayerListSkeleton } from "./community-shared";
import { getFriends, removeFriend } from "@/actions/friend";
import { SearchUsersForm } from "./search-users-form";
import { IconBtn } from "./icon-btn";
import { InfiniteScrollList } from "./infinite-scroll-list";

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
                <IconBtn
                  icon={<Swords size="14" />}
                  label="Challenge"
                  variant="amber"
                />
                <IconBtn icon={<MessageSquare size="14" />} label="Message" />
                <IconBtn
                  icon={<UserMinus size="14" />}
                  label="Remove friend"
                  variant="red"
                  onClick={removeFriend.bind(null, f.id)}
                />
              </>
            }
          />
        ))}
      </InfiniteScrollList>
    </div>
  );
}
