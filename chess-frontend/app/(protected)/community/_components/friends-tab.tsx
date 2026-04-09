import { Swords, MessageSquare, UserMinus, Users } from "lucide-react";
import { EmptyState, FriendCard } from "./community-shared";
import { getFriends, removeFriend } from "@/actions/friend";
import { SearchUsersForm } from "./search-users-form";
import { IconBtn } from "./icon-btn";

export async function FriendsTab({ query }: { query: string }) {
  const friends = await getFriends();

  return (
    <div className="flex flex-col gap-4">
      <SearchUsersForm query={query} placeholder="Find friend" />
      {!friends ? (
        <EmptyState
          icon={Users}
          title="No friends yet"
          sub="Search for players and send friend requests to get started."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {friends.map((f) => (
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
        </div>
      )}
    </div>
  );
}
