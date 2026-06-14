/** @type {import('next').NextConfig} */
const nextConfig = {
  // Self-contained server bundle for the Docker image.
  output: 'standalone',
  // Transpile the workspace TS libraries (they ship raw source).
  transpilePackages: ['@events/shared-types', '@events/api-client'],
  // Web is part of an Nx monorepo; trace files from the repo root.
  outputFileTracingRoot: new URL('../../', import.meta.url).pathname,
  // PPR is `cacheComponents: true` in Next 16 — global + strict (every dynamic
  // API access must sit inside <Suspense>). Held off until the remaining
  // dynamic routes (lists / edit / new / profile) are migrated to islands.
  // cacheComponents: true,
};

export default nextConfig;
