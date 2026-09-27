import { describe, expect, it, vi } from "vitest";
import { TonCenter, TonCenterError } from "../src/toncenter.js";

const ok = (value: unknown) => Response.json(value);

describe("TonCenter", () => {
  it("shares one request among identical callers", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () =>
      ok({ cycles: [] }),
    );
    const api = new TonCenter({
      endpoint: "https://x/api/v3/",
      rps: 1000,
      fetch,
    });
    await Promise.all([
      api.get("validators/cycles", { limit: 2 }),
      api.get("validators/cycles", { limit: 2 }),
    ]);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(String(fetch.mock.calls[0]?.[0])).toBe(
      "https://x/api/v3/validators/cycles?limit=2",
    );
  });

  it("reuses an answer while it is fresh", async () => {
    const fetch = vi.fn(async () => ok({}));
    const api = new TonCenter({ endpoint: "https://x", rps: 1000, fetch });
    await api.get("a", {}, 60_000);
    await api.get("a", {}, 60_000);
    await api.get("a");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("retries a 429", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 429 }))
      .mockResolvedValueOnce(ok({ answer: 1 }));
    const api = new TonCenter({ endpoint: "https://x", rps: 1000, fetch });
    await expect(api.get("a")).resolves.toEqual({ answer: 1 });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("reports other failures with their status, and asks again later", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response("no", { status: 500 }))
      .mockResolvedValueOnce(ok({}));
    const api = new TonCenter({ endpoint: "https://x", rps: 1000, fetch });
    const error = await api.get("a").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(TonCenterError);
    expect((error as TonCenterError).status).toBe(500);
    await expect(api.get("a")).resolves.toEqual({});
  });

  it("spaces requests to the allowed rate", async () => {
    const times: number[] = [];
    const fetch = vi.fn(async () => {
      times.push(Date.now());
      return ok({});
    });
    const api = new TonCenter({ endpoint: "https://x", rps: 20, fetch });
    await Promise.all([api.get("a"), api.get("b"), api.get("c")]);
    expect((times[2] ?? 0) - (times[0] ?? 0)).toBeGreaterThanOrEqual(95);
  });
});
