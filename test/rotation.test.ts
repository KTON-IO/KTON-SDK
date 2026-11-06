import { describe, expect, it } from "vitest";
import { parseRoundLog } from "../src/apy.js";
import { KTON } from "../src/kton.js";
import { fakeFetch, fixture } from "./helpers.js";

describe("getLastRotation", () => {
  it("reads the newest round-completion log among the pool's messages", async () => {
    const page = fixture<{
      messages: {
        destination: string | null;
        created_at: string;
        message_content?: { body?: string };
      }[];
    }>("pool-messages");
    const newest = page.messages
      .filter((m) => m.destination === null && m.message_content?.body)
      .map((m) =>
        parseRoundLog(m.message_content?.body as string, Number(m.created_at)),
      )
      .find(Boolean);
    const kton = new KTON({
      fetch: fakeFetch((url) =>
        url.pathname.endsWith("messages") ? page : undefined,
      ).fetch,
    });
    const last = await kton.getLastRotation();
    expect(last).not.toBeNull();
    expect(last).toEqual(newest);
  });

  it("is null for a pool with no round log among its messages", async () => {
    const kton = new KTON({
      fetch: fakeFetch((url) =>
        url.pathname.endsWith("messages") ? { messages: [] } : undefined,
      ).fetch,
    });
    expect(await kton.getLastRotation()).toBeNull();
  });
});
