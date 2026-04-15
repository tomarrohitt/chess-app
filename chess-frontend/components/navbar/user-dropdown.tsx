import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, User as UserIcon, Settings, LogOut } from "lucide-react";
import { getInitials } from "@/lib/constants/get-initials";
import { User } from "@/types/auth";

type UserDropdownProps = {
  user: User;
  onSignOut?: () => void;
};

export function UserDropdown({ user, onSignOut }: UserDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 hover:bg-zinc-800 transition-colors focus:outline-none data-[state=open]:bg-zinc-800">
          <Avatar className="h-8 w-8 rounded-full">
            <AvatarImage
              src={user.image ?? undefined}
              alt={user.username}
              className="object-cover"
            />
            <AvatarFallback className="rounded-full bg-zinc-700 text-xs font-bold text-zinc-300">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:block text-sm font-medium text-zinc-200">
            {user.username}
          </span>
          <ChevronDown
            className="h-3.5 w-3.5 text-zinc-400"
            strokeWidth={2.5}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-56 rounded-xl border border-zinc-800 bg-zinc-900 p-1.5 shadow-xl"
      >
        <div className="flex items-center gap-3 px-2.5 py-2 mb-1">
          <Avatar className="h-9 w-9 rounded-full">
            <AvatarImage
              src={user.image ?? undefined}
              alt={user.username}
              className="object-cover"
            />
            <AvatarFallback className="rounded-full bg-zinc-700 text-xs font-bold text-zinc-300">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-zinc-100 truncate">
              {user.username}
            </span>
            {user.name && (
              <span className="text-xs text-zinc-500 truncate">
                {user.name}
              </span>
            )}
          </div>
        </div>

        <DropdownMenuSeparator className="bg-zinc-800 mb-1.5" />

        <Item href={`/profile/${user.username}`} icon={UserIcon}>
          View Profile
        </Item>
        <Item href="/settings" icon={Settings}>
          Settings
        </Item>

        <DropdownMenuSeparator className="bg-zinc-800 my-1.5" />

        <Item onClick={onSignOut} icon={LogOut} danger>
          Sign Out
        </Item>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Item({
  href,
  onClick,
  icon: Icon,
  children,
  danger,
}: {
  href?: string;
  onClick?: () => void;
  icon: React.ElementType;
  children: React.ReactNode;
  danger?: boolean;
}) {
  const cls = danger
    ? "flex items-center gap-2.5 w-full py-2 rounded-lg text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer"
    : "flex items-center gap-2.5 w-full py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer";

  const content = (
    <>
      <Icon className="h-4 w-4 shrink-0" />
      {children}
    </>
  );

  if (href) {
    return (
      <DropdownMenuItem asChild>
        <Link href={href} className={cls}>
          {content}
        </Link>
      </DropdownMenuItem>
    );
  }

  return (
    <DropdownMenuItem asChild>
      <button onClick={onClick} className={cls}>
        {content}
      </button>
    </DropdownMenuItem>
  );
}
