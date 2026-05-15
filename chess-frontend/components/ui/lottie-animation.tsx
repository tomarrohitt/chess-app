"use client";

import dynamic from "next/dynamic";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

export function LottieAnimation({ data }: { data: unknown }) {
  return <Lottie animationData={data} loop={true} className="w-full h-full" />;
}
