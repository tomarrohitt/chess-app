import type { Metadata } from "next";
import { Raleway } from "next/font/google";

import { cn } from "@/lib/utils";
import "./globals.css";
import { Toaster } from "sonner";

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
  return (
    <html lang="en" className={raleway.variable}>
      <body className={cn("min-h-screen flex flex-col", raleway.className)}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
