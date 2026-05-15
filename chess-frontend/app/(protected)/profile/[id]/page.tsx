import { getUserById } from "@/actions/auth";
import { getRankTitle, getWinRate } from "@/lib/chess-utils";
import { PerformanceCard } from "./_components/performance-card";
import { ProfileBackground, ProfileHeader } from "./_components/profile";
import { UserInfoCard } from "./_components/userinfo-card";
import { RatingCard } from "./_components/rating-card";
import { StatCard } from "./_components/common";
import { RecentGames } from "./_components/recent-games";
import { getUserFromSession } from "@/actions/session";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [user, currentUser] = await Promise.all([
    getUserById(id),
    getUserFromSession(),
  ]);
  if (!user) return null;

  const rank = getRankTitle(user.rating);
  const winRate = getWinRate(user.wins, user.losses, user.draws);
  const totalGames = user.wins + user.losses + user.draws;

  return (
    <div className="min-h-screen bg-[#0c0c0c] relative overflow-hidden font-['Georgia','Times_New_Roman',serif] text-[#d4d4d4]">
      <ProfileBackground />

      <div className="relative z-10 max-w-275 mx-auto pt-6 px-6 pb-12">
        <ProfileHeader rating={user.rating} />

        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4">
          <div className="flex flex-col gap-3.5">
            <UserInfoCard
              user={user}
              currentUser={currentUser}
              rank={rank}
              totalGames={totalGames}
              winRate={winRate}
            />
          </div>

          <div className="flex flex-col gap-3.5">
            <RatingCard rating={user.rating} />

            <div className="grid grid-cols-3 gap-3">
              <StatCard
                label="Wins"
                value={user.wins}
                color="#4ade80"
                icon="✓"
              />
              <StatCard
                label="Losses"
                value={user.losses}
                color="#f87171"
                icon="✗"
              />
              <StatCard
                label="Draws"
                value={user.draws}
                color="#737373"
                icon="="
              />
            </div>

            <PerformanceCard
              user={user}
              totalGames={totalGames}
              winRate={winRate}
            />
          </div>
        </div>
        <RecentGames id={id} />
      </div>
    </div>
  );
}
