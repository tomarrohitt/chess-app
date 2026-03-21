import { logout } from "@/actions/auth";
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
      className="block w-full text-left px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded transition-colors"
    >
      Sign Out
    </button>
  );
};
