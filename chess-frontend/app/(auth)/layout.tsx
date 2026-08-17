import type { Metadata } from "next";
import { AuthShape } from "./_components/shape";
import { AnimatingRings } from "./_components/animating-rings";
import { Logo } from "@/components/navbar/logo";

export const metadata: Metadata = {
  title: "Chess: Sign in or create an account",
  description: "Sign in or create an account",
};

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-svh overflow-hidden"
      style={{ fontFamily: "'DM Mono', monospace" }}
    >
      <div className="relative hidden lg:flex flex-col w-[55%] overflow-hidden  bg-neutral-6">
        <AuthShape className="top-9 left-9 border-t-2 border-l-2" />
        <AuthShape className="bottom-9 right-9 border-b-2 border-r-2" />

        <div className="absolute top-11 left-0 right-0 text-center z-3 pointer-events-none">
          <p
            className="mt-2.5 mb-0 uppercase tracking-[0.35em] text-xs text-green-5/70 font-light"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            Every move defines the player
          </p>
        </div>

        <div className="absolute inset-0 flex items-center justify-center z-1">
          <AnimatingRings />
          <div className="relative">
            <Logo />
          </div>
        </div>

        <div
          className="absolute bottom-7 left-1/2 -translate-x-1/2 flex gap-5.5 z-2 tracking-1 text-xs text-green-5/70 select-none"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          {["a", "b", "c", "d", "e", "f", "g", "h"].map((f) => (
            <span key={f}>{f}</span>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-8 py-10 relative bg-neutral-6">
        <span
          className="absolute bottom-8 left-8 text-xs tracking-1 text-green-5/70  font-light  z-2 uppercase  select-none"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          e4 · e5 · Nf3
        </span>

        <div className="relative z-1 w-full min-h-19/20">{children}</div>
      </div>
    </div>
  );
}
