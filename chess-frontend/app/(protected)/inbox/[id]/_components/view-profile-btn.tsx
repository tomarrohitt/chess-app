import { UserIcon } from "lucide-react";
import Link from "next/link";

export const ViewProfileBtn = ({ id }: { id: string }) => {
  return (
    <Link
      href={`/profile/${id}`}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-zinc-300 text-sm font-medium w-full text-left cursor-pointer"
    >
      <UserIcon size={16} className="text-zinc-400" />
      View Profile
    </Link>
  );
};
