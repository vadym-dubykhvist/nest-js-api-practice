import { NextRequest } from 'next/server';

/**
 * Catch-all proxy: the browser always calls the web app's own origin
 * (`/api/...`), and this handler forwards to the real API at the
 * RUNTIME-resolved `API_URL`. Reading the env per-request (not at build)
 * is what lets one image point at localhost locally and at the in-cluster
 * API Service when deployed. Same-origin -> no CORS.
 *
 * No `dynamic = 'force-dynamic'` needed: the handler reads the live request
 * (method, headers, body, params), so it's dynamic by nature — and under
 * Cache Components that route-segment config isn't allowed anyway.
 */
const apiRoot = () =>
  (process.env.API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

async function proxy(req: NextRequest, segments: string[]): Promise<Response> {
  const target = `${apiRoot()}/api/${segments.join('/')}${req.nextUrl.search}`;

  const headers = new Headers(req.headers);
  headers.delete('host');
  headers.delete('content-length');

  const init: RequestInit = { method: req.method, headers, redirect: 'manual' };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.arrayBuffer();
  }

  const upstream = await fetch(target, init);

  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete('content-encoding');
  responseHeaders.delete('content-length');
  responseHeaders.delete('transfer-encoding');

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

type RouteContext = { params: Promise<{ path: string[] }> };

const handler = async (req: NextRequest, ctx: RouteContext) =>
  proxy(req, (await ctx.params).path);

export {
  handler as DELETE,
  handler as GET,
  handler as OPTIONS,
  handler as PATCH,
  handler as POST,
  handler as PUT,
};
