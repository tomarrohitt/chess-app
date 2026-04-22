"use client";

import { logout } from "@/actions/auth";
import { Loader, LogOut } from "lucide-react";
import { useTransition } from "react";

export const LogoutButton = () => {
  const [pending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logout();
    });
  }

  return (
    <button
      onClick={handleLogout}
      disabled={pending}
      className="flex items-center gap-2.5 w-full p-2 rounded-lg text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer"
    >
      {pending ? (
        <Loader className="h-4 w-4 shrink-0 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4 shrink-0" />
      )}
      Sign Out
    </button>
  );
};
