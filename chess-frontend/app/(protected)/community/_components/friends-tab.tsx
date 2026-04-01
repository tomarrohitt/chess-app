import { Swords, MessageSquare, UserMinus, Users } from "lucide-react";
import {
  PlayerCard,
  IconBtn,
  EmptyState,
  FriendCard,
} from "./community-shared";
import { getFriends } from "@/actions/friend";
import { SearchUsersForm } from "./search-users-form";

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
                  <IconBtn icon={Swords} label="Challenge" variant="amber" />
                  <IconBtn icon={MessageSquare} label="Message" />
                  <IconBtn
                    icon={UserMinus}
                    label="Remove friend"
                    variant="red"
                    // onClick={() => removeFriend(f.id)}
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
