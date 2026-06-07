/** @type {import('next').NextConfig} */
const nextConfig = {
  // Self-contained server bundle for the Docker image.
  output: 'standalone',
  // Transpile the workspace TS libraries (they ship raw source).
  transpilePackages: ['@events/shared-types', '@events/api-client'],
  // Web is part of an Nx monorepo; trace files from the repo root.
  outputFileTracingRoot: new URL('../../', import.meta.url).pathname,
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
