import { EmptyState, PlayerCard } from "./community-shared";
import { searchUsers } from "@/actions/friend";
import { SearchUsersForm } from "./search-users-form";
import { Search } from "lucide-react";

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
            <PlayerCard key={p.id} player={p} />
          ))}
        </div>
      )}
    </div>
  );
}
