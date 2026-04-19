"use client";

import * as React from "react";
import { MessageCircle, Search, User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { SearchChatUserInfo } from "@/types/chat";
import { useInbox } from "./inbox-context";

export function SearchConversation({
  friends,
}: {
  friends: SearchChatUserInfo[];
}) {
  const [open, setOpen] = React.useState(false);

  const conversationsMap = useInbox((c) => c.conversations);
  const conversationsList = React.useMemo(
    () => Object.values(conversationsMap),
    [conversationsMap],
  );
  // const router = useRouter();

  return (
    <>
      <button className="relative w-full group" onClick={() => setOpen(true)}>
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-hover:text-zinc-400 transition-colors"
        />
        <div
          className="w-full h-9 rounded-xl pl-9 pr-4 text-sm text-zinc-600 flex items-center transition-all"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <span className="text-zinc-600 text-xs">Search conversations...</span>
        </div>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Search conversations..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <React.Activity
              mode={conversationsList.length > 0 ? "visible" : "hidden"}
            >
              <CommandGroup heading="Conversations">
                {conversationsList?.map(({ user, lastMessage }) => (
                  <CommandItem
                    key={user.id}
                    value={`${user.name} ${user.username}`}
                    className="flex items-center gap-3 py-2 cursor-pointer"
                    onClick={() => setOpen(false)}
                  >
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarImage src={user.image || ""} alt={user.name} />
                      <AvatarFallback className="bg-white/10">
                        <MessageCircle size={16} className="text-zinc-400" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <div className="flex justify-around items-center gap-1.5">
                        <span className="text-sm font-medium text-zinc-200">
                          {user.name}
                        </span>
                        <span className="text-xs text-zinc-500">
                          @{user.username}
                        </span>
                      </div>
                      {lastMessage && (
                        <span className="text-xs text-zinc-500 truncate">
                          {lastMessage.content}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </React.Activity>

            <CommandSeparator />

            <React.Activity mode={friends.length > 0 ? "visible" : "hidden"}>
              <CommandGroup heading="Friends">
                {friends.map((f) => (
                  <CommandItem
                    key={f.id}
                    value={`${f.name} ${f.username}`}
                    className="flex items-center gap-2 py-1.5 cursor-pointer"
                    onClick={() => setOpen(false)}
                  >
                    <Avatar className="w-7 h-7 shrink-0">
                      <AvatarImage src={f.image || ""} alt={f.name} />
                      <AvatarFallback className="bg-white/10">
                        <User size={14} className="text-zinc-400" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-zinc-300">{f.name}</span>
                      <span className="text-xs text-zinc-500">
                        @{f.username}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </React.Activity>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
