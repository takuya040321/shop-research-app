import type { NextConfig } from "next";

const useProxy = process.env.USE_PROXY === "true";

const nextConfig: NextConfig = {
  images: useProxy
    ? {
        // プロキシ使用時はカスタムローダーを使用
        loader: "custom",
        loaderFile: "./src/lib/image-loader.ts",
        remotePatterns: [
          {
            protocol: "https",
            hostname: "cdn-7361.cafe24img.com",
            port: "",
            pathname: "/**",
          },
          {
            protocol: "https",
            hostname: "www.dhc.co.jp",
            port: "",
            pathname: "/**",
          },
          {
            protocol: "https",
            hostname: "thumbnail.image.rakuten.co.jp",
            port: "",
            pathname: "/**",
          },
        ],
      }
    : {
        // プロキシ未使用時はデフォルトローダー
        remotePatterns: [
          {
            protocol: "https",
            hostname: "cdn-7361.cafe24img.com",
            port: "",
            pathname: "/**",
          },
          {
            protocol: "https",
            hostname: "www.dhc.co.jp",
            port: "",
            pathname: "/**",
          },
          {
            protocol: "https",
            hostname: "thumbnail.image.rakuten.co.jp",
            port: "",
            pathname: "/**",
          },
        ],
      },
};

export default nextConfig;
