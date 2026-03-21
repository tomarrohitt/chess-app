import Link from "next/link";
import { AuthSection } from "./auth-section";
import { Suspense } from "react";
export default function Navbar() {
  return (
    <nav className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex flex-1 items-center space-x-2">
            <span className="text-3xl text-white drop-shadow-lg select-none">
              ♟
            </span>
            <span className="text-xl font-black tracking-widest uppercase text-white">
              Chess
            </span>
          </Link>

          <div className="flex items-center justify-end space-x-4 flex-2">
            <Suspense fallback={<NavbarSkeleton />}>
              <AuthSection />
            </Suspense>
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavbarSkeleton() {
  return (
    <div className="flex justify-between items-center gap-6">
      <nav className="relative flex gap-1">
        <div className="px-4 py-2">
          <div className="h-4 w-12 bg-zinc-800 rounded animate-pulse" />
        </div>
        <div className="px-4 py-2">
          <div className="h-4 w-28 bg-zinc-800 rounded animate-pulse" />
        </div>
      </nav>

      <div className="flex items-center gap-4 pl-6 border-l border-zinc-800 ml-10">
        <div className="flex items-center gap-2 py-2">
          <div className="w-9 h-9 bg-zinc-800 rounded-full animate-pulse" />
          <div className="hidden lg:flex flex-col items-start">
            <div className="h-4 w-20 bg-zinc-800 rounded animate-pulse" />
          </div>
          <div className="w-4 h-4 bg-zinc-800 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
