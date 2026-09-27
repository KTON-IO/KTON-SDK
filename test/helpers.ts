import { readFileSync } from "node:fs";

/** A response TonCenter gave, captured into test/fixtures. */
export function fixture<T = unknown>(name: string): T {
  return JSON.parse(
    readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), "utf8"),
  ) as T;
}

type Route = (url: URL, body: Record<string, unknown> | null) => unknown;

/**
 * A fetch that answers from fixtures. `route` returns the fixture's JSON for a
 * request, or undefined for one the test did not expect.
 */
export function fakeFetch(route: Route) {
  const calls: { url: URL; body: Record<string, unknown> | null }[] = [];
  const fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const body = init?.body ? JSON.parse(String(init.body)) : null;
    calls.push({ url, body });
    const answer = route(url, body);
    if (answer === undefined) {
      return new Response(`unexpected ${url.pathname}`, { status: 500 });
    }
    return Response.json(answer);
  };
  return { fetch: fetch as typeof globalThis.fetch, calls };
}
