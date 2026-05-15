import { LottieAnimation } from "@/components/ui/lottie-animation";
import type { Metadata } from "next";
import WildKnight from "@/public/assets/lottie/knight.json";
import Stamp from "@/public/assets/lottie/Stamp.json";

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
      <div className="hidden lg:block fixed left-12 top-2/5 -translate-y-1/2 size-100 pointer-events-none opacity-80">
        <LottieAnimation data={WildKnight} />
      </div>

      <div className="w-full max-w-md relative z-10">{children}</div>
      <div className="hidden lg:block fixed right-12 top-1/2 -translate-y-1/2 size-100 pointer-events-none opacity-80 ">
        <LottieAnimation data={Stamp} />
      </div>
    </div>
  );
}
