"use client";

import { Users, Search, Bell, UserX } from "lucide-react";
import { motion } from "framer-motion";
import { useOptimistic, useTransition } from "react";
import { useSpinDelay } from "spin-delay";

import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PlayerListSkeleton } from "./community-shared";

const TABS = [
  {
    id: "friends",
    label: "Friends",
    icon: Users,
  },
  {
    id: "find",
    label: "Find Players",
    icon: Search,
  },
  {
    id: "requests",
    label: "Requests",
    icon: Bell,
  },
  {
    id: "blocked",
    label: "Blocked",
    icon: UserX,
  },
] as const;

export function CommunityNav({
  active,
  counts,
  children,
}: {
  active: string;
  counts: { friends: number; requests: number; blocked: number };
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [_, startTransition] = useTransition();
  const [optimisticActive, setOptimisticActive] = useOptimistic(active);

  const isPendingNav = optimisticActive !== active;
  const showSkeleton = useSpinDelay(isPendingNav, {
    delay: 250,
    minDuration: 300,
  });

  const handleTabChange = (id: string) => {
    startTransition(() => {
      setOptimisticActive(id);
      const params = new URLSearchParams(searchParams);
      params.set("tab", id);
      params.delete("q");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };
  return (
    <>
      <div className="mb-8">
        <h1
          className="text-2xl font-bold text-white tracking-tight mb-1"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: "-0.03em",
          }}
        >
          Community
        </h1>
        <p className="text-sm text-zinc-500">
          Manage your connections, discover players, handle requests.
        </p>
      </div>
      <div
        className="flex gap-1 p-1 rounded-2xl mb-6"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
          isolation: "isolate",
        }}
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = optimisticActive === id;
          const displayBadge =
            id === "find" ? 0 : counts[id as keyof typeof counts];
          return (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={cn(
                "relative rounded-full px-3 py-1.5 text-sm font-semibold text-white outline-sky-400 transition focus-visible:outline-2 flex-1 flex items-center justify-center gap-1.5 h-9 cursor-pointer",
                isActive ? "" : "hover:text-white/60",
              )}
              style={{
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {isActive && (
                <motion.span
                  layoutId="bubble"
                  className="absolute inset-0 z-10 bg-white mix-blend-difference"
                  style={{
                    borderRadius: 9999,
                    background: isActive
                      ? "rgba(255,255,255,0.1)"
                      : "transparent",
                    fontFamily: "'DM Sans', sans-serif",
                    border: isActive
                      ? "1px solid rgba(255,255,255,0.12)"
                      : "1px solid transparent",
                  }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon size={13} />
              <span className="hidden sm:inline">{label}</span>
              {displayBadge > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold px-1"
                  style={{
                    background:
                      id === "requests" ? "#f97316" : "rgba(255,255,255,0.15)",
                    color: id === "requests" ? "#fff" : "#a1a1aa",
                  }}
                >
                  {displayBadge}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {showSkeleton ? (
        <div className="flex flex-col gap-4">
          {["friends", "find"].includes(optimisticActive) && (
            <div
              className="w-full h-10 rounded-xl animate-pulse"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            />
          )}
          <PlayerListSkeleton />
        </div>
      ) : (
        children
      )}
    </>
  );
}
