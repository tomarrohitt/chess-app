import Link from "next/link";

const links = [
  { name: "Play", href: "/" },
  { name: "Leaderboard", href: "/leaderboard" },
  { name: "Community", href: "/community" },
  { name: "Inbox", href: "/inbox" },
];

export function NavLinks() {
  return (
    <nav className="relative flex gap-1">
      {links.map((link) => {
        return (
          <Link
            key={link.href}
            href={link.href}
            className="relative px-4 py-2 text-sm font-bold tracking-widest uppercase transition-colors text-zinc-400 hover:text-white"
          >
            {link.name}
          </Link>
        );
      })}
    </nav>
  );
}
