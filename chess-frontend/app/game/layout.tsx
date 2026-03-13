import { getUserFromSession } from "@/actions/session";

import { SocketProvider } from "@/store/socket-provider";
import { ConnectionStatus } from "./[id]/_components/connection-status";
import { SearchingModal } from "@/components/game/searching-modal";
import { redirect } from "next/navigation";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserFromSession();

  if (!user) redirect("/login");

  return (<>

    {
      user ? (
        <SocketProvider user={user} >
          <ConnectionStatus />
          <SearchingModal />
          {children}
        </SocketProvider>
      ) : (
        children
      )
    }
  </>

  );
}