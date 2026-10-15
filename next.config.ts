import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: false,
  partialPrefetching: false,
  outputFileTracingIncludes: {
    "/api/admin/orders/*/pdf": ["./public/fonts/lato-regular.ttf"],
    "/api/admin/orders/confirmed-report": ["./public/fonts/lato-regular.ttf"],
  },
  async headers() {
    return [
      {
        source: "/pedido/:path*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Cache-Control", value: "private, no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
