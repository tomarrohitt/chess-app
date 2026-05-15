import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chess",
  description: "Sign in or create an account",
};

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-lvh flex items-center justify-center p-4"
      style={{
        backgroundColor: "#080808",
        backgroundImage: `
          linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
      }}
    >
      {/* Corner chess board accents */}
      <div
        className="fixed top-0 left-0 w-40 h-40 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `repeating-conic-gradient(#c9a84c 0% 25%, transparent 0% 50%)`,
          backgroundSize: "20px 20px",
        }}
      />
      <div
        className="fixed bottom-0 right-0 w-40 h-40 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `repeating-conic-gradient(#c9a84c 0% 25%, transparent 0% 50%)`,
          backgroundSize: "20px 20px",
        }}
      />

      <div className="w-full max-w-md relative z-10">{children}</div>
    </div>
  );
}
