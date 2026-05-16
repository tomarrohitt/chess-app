import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/**",
      },
    ],
    dangerouslyAllowLocalIP: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://risenetup-chess-monolith.hf.space/api/:path*",
      },
    ];
  },
  reactCompiler: true,
};

export default nextConfig;
