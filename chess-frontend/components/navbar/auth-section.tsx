import { UserDropdown } from "./user-dropdown";

import { NavLinks } from "./navlinks";
import { getUserFromSession } from "@/actions/session";
import Link from "next/link";

export async function AuthSection() {
  const user = await getUserFromSession();

  if (!user) {
    return <UnProtectedSection />;
  }

  return (
    <div className="flex justify-between items-center gap-6">
      <NavLinks />

      <div className="flex items-center gap-4 pl-6 border-l border-zinc-800 ml-10">
        <UserDropdown user={user} />
      </div>
    </div>
  );
}

const UnProtectedSection = () => {
  return (
    <div className="flex items-center gap-4">
      <Link
        href="/login"
        className="text-sm font-bold tracking-widest uppercase text-zinc-400 hover:text-white transition-colors"
      >
        Login{" "}
      </Link>
      <Link href="/register">
        <button className="relative px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold tracking-widest uppercase shadow-lg shadow-blue-900/20 hover:bg-blue-500 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none">
          Register{" "}
        </button>
      </Link>
    </div>
  );
};
