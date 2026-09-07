import type { NextConfig } from "next";

// `standalone` output is only for the Docker image (server.js). Vercel uses
// its own build output, so enable it solely for Docker builds to avoid
// interfering with Vercel's finalize stage.
// Dockerfile sets: --build-arg DOCKER_BUILD=1
const nextConfig: NextConfig = {
  ...(process.env.DOCKER_BUILD ? { output: "standalone" as const } : {}),
};

export default nextConfig;
