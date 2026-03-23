import { getUserFromSession } from "@/actions/session";
import { SocketProvider } from "@/store/socket-provider";
import { redirect } from "next/navigation";
import { ConnectionStatus } from "./game/[id]/_components/connection-status";
import { SearchingModal } from "@/components/game/searching-modal";
import { GlobalRematchToast } from "./game/[id]/_components/global-rematch-toast";
import { ActiveGameBanner } from "@/components/game/active-game-banner";

const ProtectedLayout = async ({ children }: { children: React.ReactNode }) => {
  const user = await getUserFromSession();
  if (!user) {
    redirect("/login");
  }

  return (
    <SocketProvider user={user}>
      {/* <ConnectionStatus /> */}
      <SearchingModal />
      <GlobalRematchToast />
      <ActiveGameBanner />

      {children}
    </SocketProvider>
  );
};

export default ProtectedLayout;
