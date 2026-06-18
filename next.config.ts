import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  typescript: { ignoreBuildErrors: false },
  devIndicators: false,
};

export default nextConfig;
