import { Address } from "@ton/core";
import { describe, expect, it } from "vitest";
import { num, parsePoolData } from "../src/pool.js";
import type { RunGetMethodResult } from "../src/toncenter.js";
import { fixture } from "./helpers.js";

const stack = (name: string) => fixture<RunGetMethodResult>(name).stack;

describe("parsePoolData", () => {
  it("reads the KTON pool", () => {
    const pool = parsePoolData(stack("pool-full-data"));
    expect(pool.state).toBe(0);
    expect(pool.halted).toBe(false);
    expect(pool.depositsOpen).toBe(true);
    expect(pool.optimisticDepositWithdrawals).toBe(true);
    expect(pool.governanceFee).toBeCloseTo(0.16, 6);
    // 0xffffff: the most the field holds, all of the withdrawal.
    expect(pool.instantWithdrawalFee).toBeCloseTo(1, 6);
    expect(
      pool.jettonMinter.equals(
        Address.parse("EQBuIhXNNkWf9AW9miNGNTSO_uFZ23ejfIWrieXge5f733mw"),
      ),
    ).toBe(true);
    expect(pool.totalBalance).toBe(0x6572267ae258an);
    expect(pool.supply).toBe(0x5e9c241755c3en);
    expect(pool.projectedTotalBalance).toBe(0x657222c135b8an);
    expect(pool.projectedSupply).toBe(0x5e9c241755c3en);
    // Resting: nothing lent in the running round, the next one's loans out.
    expect(pool.previousRound.borrowed).toBe(0n);
    expect(pool.currentRound.roundId).toBe(0x2a0);
    expect(pool.currentRound.borrowed).toBe(0x653f6d67a4e77n);
    expect(pool.depositPayout).toBeNull();
    expect(pool.withdrawalPayout).toBeNull();
  });

  it("reads the pKTON pool", () => {
    const pool = parsePoolData(stack("pkton-pool-full-data"));
    expect(pool.instantWithdrawalFee).toBe(0);
    expect(pool.governanceFee).toBeCloseTo(1, 6);
    expect(pool.totalBalance).toBe(0xf07591f9f4870n);
  });

  it("reads a pool of the older 30-value layout", () => {
    // Tonstakers runs the contract version before instant withdrawal fees.
    const pool = parsePoolData(stack("tonstakers-pool-full-data"));
    expect(pool.instantWithdrawalFee).toBe(0);
    expect(pool.withdrawalPayout?.toRawString()).toBe(
      "0:3085e139ea0b5c964d35b4d1d69229eb7ce977c0217fb5c87a3a072a446bc778",
    );
    expect(pool.requestedForWithdrawal).toBe(0x22ecf0cb80848n);
    expect(pool.projectedSupply).toBeGreaterThan(0n);
  });

  it("refuses a stack of another shape", () => {
    expect(() => parsePoolData(stack("pool-full-data").slice(1))).toThrow(
      /33 values/,
    );
  });
});

describe("num", () => {
  it("reads TonCenter's signed hex", () => {
    expect(num({ type: "num", value: "-0x1" })).toBe(-1n);
    expect(num({ type: "num", value: "0x0" })).toBe(0n);
    expect(num({ type: "num", value: "0xffffff" })).toBe(16777215n);
  });
});
