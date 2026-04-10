import { BlockedTab } from "./_components/blocked-tab";
import { CommunityNav } from "./_components/community-client";
import { FindPlayersTab } from "./_components/find-players-tab";
import { FriendsTab } from "./_components/friends-tab";
import { RequestsTab } from "./_components/requests-tab";

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q: string }>;
}) {
  const { tab, q } = await searchParams;
  const active = tab || "friends";
  const query = q || "";

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: "#0d0d10",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div className="fixed inset-0 pointer-events-none opacity-[0.025]" />
      <div className="relative max-w-2xl mx-auto px-4 py-10">
        <CommunityNav active={active}>
          <div key={active}>
            {active === "friends" && <FriendsTab query={query} />}
            {active === "find" && <FindPlayersTab query={query} />}
            {active === "requests" && <RequestsTab />}
            {active === "blocked" && <BlockedTab />}
          </div>
        </CommunityNav>
      </div>
    </div>
  );
}
