import { describe, expect, it } from "vitest";
import { KTON } from "../src/kton.js";
import { fakeFetch, fixture } from "./helpers.js";

const HOUR = 3_600_000;

describe("getSchedule", () => {
  // The captured cycles run 1790463752 to 1790594824 (two 65,536 s rounds,
  // stake held 32,768 s).
  const kton = () =>
    new KTON({
      fetch: fakeFetch((url) =>
        url.pathname.endsWith("validators/cycles")
          ? fixture("validator-cycles")
          : undefined,
      ).fetch,
    });

  it("puts every time after now, a withdrawal no earlier than the next rotation", async () => {
    const now = 1790540000 * 1000;
    const at = await kton().getSchedule(now);
    for (const moment of Object.values(at)) {
      expect(moment.getTime()).toBeGreaterThan(now);
    }
    expect(at.unstakeArrival.getTime()).toBeGreaterThanOrEqual(
      at.nextRotation.getTime(),
    );
    expect(at.firstPayoutForNewStake.getTime()).toBeGreaterThanOrEqual(
      at.nextPayout.getTime(),
    );
  });

  it("rotates about 9 and 27 hours apart, and skips a rotation under an hour away", async () => {
    const first = (await kton().getSchedule(1790540000 * 1000)).nextRotation;
    const after = await kton().getSchedule(first.getTime() + 1000);
    const gap = (after.nextRotation.getTime() - first.getTime()) / HOUR;
    expect([9.1, 27.3]).toContainEqual(Math.round(gap * 10) / 10);
    const close = await kton().getSchedule(first.getTime() - 0.5 * HOUR);
    expect(close.nextRotation.getTime()).toBe(first.getTime());
    expect(close.unstakeArrival.getTime()).toBeGreaterThan(first.getTime());
  });
});
