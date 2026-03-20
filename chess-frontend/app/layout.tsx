import type { Metadata } from "next";
import { Raleway } from "next/font/google";

import { cn } from "@/lib/utils";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { getUserFromSession } from "@/actions/session";
import { redirect } from "next/navigation";
import { SocketProvider } from "@/store/socket-provider";
import { ConnectionStatus } from "./game/[id]/_components/connection-status";
import { SearchingModal } from "@/components/game/searching-modal";

const raleway = Raleway({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Chess",
  description: "Play chess online",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserFromSession();
  return (
    <html lang="en" className={raleway.variable}>
      <body className={cn("min-h-screen flex flex-col", raleway.className)}>
        {user ? (
          <SocketProvider user={user}>
            <ConnectionStatus />
            <SearchingModal />
            {children}
          </SocketProvider>
        ) : (
          children
        )}
        <Toaster position="bottom-right" duration={30} />
      </body>
    </html>
  );
}
