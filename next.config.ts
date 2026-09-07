import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for the Docker image below (standalone server.js output).
  output: "standalone",
};

export default nextConfig;
