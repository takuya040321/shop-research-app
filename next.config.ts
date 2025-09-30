import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn-7361.cafe24img.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
