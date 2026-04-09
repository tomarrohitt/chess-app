import { EmptyState } from "./community-shared";
import { addFriend, searchUsers } from "@/actions/friend";
import { SearchUsersForm } from "./search-users-form";
import { Search, Swords, UserPlus, UserX } from "lucide-react";
import { IconBtn } from "./icon-btn";
import { PlayerCard } from "./player-card";

export async function FindPlayersTab({ query }: { query: string }) {
  const results = query ? await searchUsers(query) : null;

  return (
    <div className="flex flex-col gap-4">
      <SearchUsersForm query={query} placeholder="Type the name or username" />
      {!query ? (
        <div className="text-center py-10 text-zinc-500">
          Type a name or username to search all players.
        </div>
      ) : !results ? (
        <EmptyState
          icon={Search}
          title="No results found"
          sub={`No users match "${query}". Try a different name or username.`}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {results.map((p) => (
            <PlayerCard
              key={p.id}
              player={p}
              actions={
                <>
                  <IconBtn
                    icon={<Swords size="14" />}
                    label="Challenge to game"
                    variant="amber"
                  />
                  <IconBtn
                    onClick={addFriend.bind(null, p.id)}
                    icon={<UserPlus size="14" />}
                    label="Send friend request"
                    variant="green"
                  />
                  <IconBtn
                    icon={<UserX size="14" />}
                    label="Block user"
                    variant="red"
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
