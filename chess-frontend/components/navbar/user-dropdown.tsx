import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, User, Settings, LogOut } from "lucide-react";
import { getInitials } from "@/lib/constants/get-initials";

type UserDropdownProps = {
  user: {
    username: string;
    name?: string;
    title?: string;
    avatar?: string;
    rating?: {
      blitz?: number;
      rapid?: number;
      bullet?: number;
      classical?: number;
    };
  };
  onSignOut?: () => void;
};

const TITLE_STYLES: Record<string, string> = {
  GM: "border-amber-600/50 bg-amber-500/10 text-amber-400",
  IM: "border-orange-600/50 bg-orange-500/10 text-orange-400",
  FM: "border-yellow-600/50 bg-yellow-500/10 text-yellow-400",
  NM: "border-zinc-600/50 bg-zinc-500/10 text-zinc-400",
};

const defaultStyle = "border-red-700/50 bg-red-500/10 text-red-400";

export function UserDropdown({ user, onSignOut }: UserDropdownProps) {
  const ratings = [
    { label: "Blitz", value: user.rating?.blitz, icon: "⚡" },
    { label: "Rapid", value: user.rating?.rapid, icon: "♟" },
    { label: "Bullet", value: user.rating?.bullet, icon: "🔥" },
    { label: "Classical", value: user.rating?.classical, icon: "🔥" },
  ].filter((r) => r.value !== undefined);

  const titleStyle = user.title
    ? (TITLE_STYLES[user.title] ?? defaultStyle)
    : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="group flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition-all duration-150 hover:bg-zinc-800/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 data-[state=open]:bg-zinc-800/70">
          <Avatar className="h-8 w-8 rounded-full ring-1 ring-zinc-700/60 transition-all group-hover:ring-amber-500/40">
            <AvatarImage
              src={user.avatar}
              alt={user.username}
              className="object-cover"
            />
            <AvatarFallback className="rounded-full bg-zinc-800 text-[11px] font-bold text-zinc-400">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>

          <div className="hidden flex-col items-start sm:flex">
            <div className="flex items-center gap-1.5">
              {user.title && (
                <Badge
                  variant="outline"
                  className={`h-4 rounded-sm px-1 py-0 text-[10px] font-black tracking-wider ${titleStyle}`}
                >
                  {user.title}
                </Badge>
              )}
              <span className="text-sm font-semibold text-zinc-200 leading-none">
                {user.username}
              </span>
            </div>
            {user.name && (
              <span className="mt-0.5 text-[11px] text-zinc-500 leading-none">
                {user.name}
              </span>
            )}
          </div>

          <ChevronDown
            className="h-3.5 w-3.5 text-zinc-500 transition-transform duration-200 group-data-[state=open]:rotate-180"
            strokeWidth={2.5}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 rounded-xl border border-zinc-800 bg-zinc-900 p-0 shadow-2xl shadow-black/60 animate-in fade-in-0 zoom-in-95"
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-800">
          <Avatar className="h-11 w-11 rounded-full ring-1 ring-zinc-700/60">
            <AvatarImage
              src={user.avatar}
              alt={user.username}
              className="object-cover"
            />
            <AvatarFallback className="rounded-full bg-zinc-800 text-sm font-bold text-zinc-400">
              {user.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              {user.title && (
                <Badge
                  variant="outline"
                  className={`h-4 shrink-0 rounded-sm px-1 py-0 text-[10px] font-black tracking-wider ${titleStyle}`}
                >
                  {user.title}
                </Badge>
              )}
              <span className="truncate text-sm font-bold text-zinc-100">
                {user.username}
              </span>
            </div>
            {user.name && (
              <span className="truncate text-xs text-zinc-500">
                {user.name}
              </span>
            )}
          </div>
        </div>

        {ratings.length > 0 && (
          <div className="grid grid-cols-3 divide-x divide-zinc-800 border-b border-zinc-800">
            {ratings.map((r) => (
              <div
                key={r.label}
                className="flex flex-col items-center gap-0.5 py-3 px-2"
              >
                <span className="text-[11px] text-zinc-500 tracking-wide uppercase">
                  {r.icon} {r.label}
                </span>
                <span className="font-mono text-base font-black text-amber-400 tabular-nums leading-none">
                  {r.value}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="p-1.5">
          <DropdownMenuItem asChild>
            <Link
              href={`/profile/${user.username}`}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus:bg-zinc-800 focus:text-zinc-100 focus:outline-none"
            >
              <User className="h-4 w-4 text-zinc-500" strokeWidth={2} />
              View Profile
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link
              href="/settings"
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus:bg-zinc-800 focus:text-zinc-100 focus:outline-none"
            >
              <Settings className="h-4 w-4 text-zinc-500" strokeWidth={2} />
              Settings
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1 border-zinc-800" />

          <DropdownMenuItem
            onClick={onSignOut}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-rose-400 transition-colors hover:text-rose-300 focus:bg-rose-500/10 focus:text-rose-300 focus:outline-none"
          >
            <LogOut className="h-4 w-4" strokeWidth={2} />
            Sign Out
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
