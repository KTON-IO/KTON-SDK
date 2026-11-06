import { describe, expect, it } from "vitest";
import { ONE_TON } from "../src/constants.js";
import { type PoolData, parsePoolData } from "../src/pool.js";
import type { RunGetMethodResult } from "../src/toncenter.js";
import { checkWithdrawal } from "../src/withdrawal.js";
import { fixture } from "./helpers.js";

const pool = (name: string) =>
  parsePoolData(fixture<RunGetMethodResult>(name).stack);
const balance = (name: string) =>
  BigInt(fixture<{ balance: string }>(name).balance);
const KTON = ONE_TON;

describe("checkWithdrawal", () => {
  // 2026-11-06: the previous round's loan out (1.92M), 4,853 TON free, the
  // instant fee 0.2%.
  const now = pool("pool-full-data-2026-11-06");
  const free = balance("pool-account-2026-11-06");

  it("takes a queued withdrawal while the previous round's loan is out", () => {
    const check = checkWithdrawal(now, free, 100_000n * KTON, "wait");
    expect(check.accepted).toBe(true);
    expect(check.fee).toBe(0n);
    expect(check.limit).toBeGreaterThan(1_000_000n * KTON);
  });

  it("pays a small withdrawal at once, less the pool's instant fee", () => {
    expect(now.instantWithdrawalFee).toBeCloseTo(0.002, 4);
    const check = checkWithdrawal(now, free, 1_000n * KTON, "instant");
    expect(check.accepted).toBe(true);
    expect(check.fee * 1000n).toBeGreaterThan((check.value * 19n) / 10n);
    expect(check.fee * 1000n).toBeLessThan((check.value * 21n) / 10n);
    expect(check.receive).toBe(check.value - check.fee);
  });

  it("refuses an instant withdrawal above the free balance, and says how much it would take", () => {
    const check = checkWithdrawal(now, free, 10_000n * KTON, "instant");
    expect(check.accepted).toBe(false);
    expect(check.reason).toBe("no-liquidity");
    expect(checkWithdrawal(now, free, check.limit, "instant").accepted).toBe(
      true,
    );
    expect(
      checkWithdrawal(now, free, check.limit + KTON, "instant").accepted,
    ).toBe(false);
  });

  // 2026-01-14 03:10Z: the previous round empty, 2,908.457 TON in the pool,
  // NAV about 1. Five queued burns of 23,482 KTON came back; 2,000 + 800 went
  // through (kton-expert CONTRACTS §5.7).
  const resting: PoolData = {
    ...now,
    totalBalance: 1_231_432_642_000_000n,
    supply: 1_231_432_642_000_000n,
    projectedTotalBalance: 1_231_432_642_000_000n,
    projectedSupply: 1_231_432_642_000_000n,
    previousRound: { ...now.previousRound, borrowed: 0n },
    requestedForWithdrawal: 0n,
  };
  const thin = 2_908_457_000_000n;

  it("refuses the queued burn the pool returned on 2026-01-14, and takes what went through", () => {
    const big = checkWithdrawal(resting, thin, 23_482n * KTON, "wait");
    expect(big.accepted).toBe(false);
    expect(big.reason).toBe("queue-too-large");
    expect(checkWithdrawal(resting, thin, 2_800n * KTON, "wait").accepted).toBe(
      true,
    );
    // The limit is the free balance less the 10 TON kept and the 1 TON margin.
    expect(big.limit / KTON).toBe(2_897n);
  });

  it("counts the burns already queued this round", () => {
    const queued = { ...resting, requestedForWithdrawal: 2_800n * KTON };
    expect(checkWithdrawal(queued, thin, 100n * KTON, "wait").accepted).toBe(
      false,
    );
    expect(checkWithdrawal(queued, thin, 90n * KTON, "wait").accepted).toBe(
      true,
    );
  });

  it("charges the instant fee exactly as the pool keeps it, in 2^24ths", () => {
    // 33,554 / 2^24 on 2026-11-06, a hair under 0.2%.
    const check = checkWithdrawal(now, free, 1_000n * KTON, "instant");
    expect(check.fee).toBe((check.value * 33_554n) / 16_777_216n);
  });

  it("refuses nothing worth paying, and predicts nothing while a rotation is pending", () => {
    expect(checkWithdrawal(now, free, 0n, "wait").reason).toBe("too-small");
    for (const mode of ["wait", "instant"] as const) {
      const pending = checkWithdrawal(now, free, KTON, mode, {
        rotationPending: true,
      });
      expect(pending).toMatchObject({
        accepted: false,
        reason: "rotation-pending",
        limit: 0n,
      });
    }
  });

  it("keeps 1 TON in hand under the instant limit", () => {
    const check = checkWithdrawal(now, free, 10_000n * KTON, "instant");
    const freeTons = free - 10n * KTON;
    expect((check.limit * now.totalBalance) / now.supply).toBeLessThanOrEqual(
      freeTons - KTON,
    );
  });

  it("refuses everything while the pool is halted", () => {
    const halted = { ...now, halted: true };
    expect(checkWithdrawal(halted, free, KTON, "wait")).toMatchObject({
      reason: "halted",
      limit: 0n,
    });
    expect(checkWithdrawal(halted, free, KTON, "instant").reason).toBe(
      "halted",
    );
  });
});
