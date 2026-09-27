import { Address, Cell } from "@ton/core";
import { describe, expect, it } from "vitest";
import { OP } from "../src/constants.js";
import { buildStakeMessage, buildUnstakeMessage } from "../src/messages.js";

const POOL = "EQA9HwEZD_tONfVz6lJS0PVKR5viEiEGyj9AuQewGQVnXPg0";
const OWNER = Address.parse(
  "0:2918c2d787bd5136a3af89a4a851fac843d922929d17422c4e2437d8ba255b5e",
);
const JETTON_WALLET =
  "0:0ab52334ce4c1d9165ccf7d18bb4eb4587dc4fbf72de637e5da0920ead22b781";

describe("buildStakeMessage", () => {
  it("deposits the amount plus the 1 TON deposit fee", () => {
    const message = buildStakeMessage({
      pool: POOL,
      amount: 5_000_000_000n,
      queryId: 42n,
    });
    expect(message.address).toBe(POOL);
    expect(message.amount).toBe("6000000000");
    const body = Cell.fromBase64(message.payload).beginParse();
    expect(body.loadUint(32)).toBe(OP.deposit);
    expect(body.loadUintBig(64)).toBe(42n);
    expect(body.remainingBits).toBe(0);
    expect(body.remainingRefs).toBe(0);
  });

  it("addresses a testnet pool as test-only", () => {
    const message = buildStakeMessage({
      pool: POOL,
      amount: 1n,
      testnet: true,
    });
    expect(Address.parseFriendly(message.address).isTestOnly).toBe(true);
  });

  it("refuses nothing to stake", () => {
    expect(() => buildStakeMessage({ pool: POOL, amount: 0n })).toThrow();
  });
});

describe("buildUnstakeMessage", () => {
  const burn = (mode: "wait" | "instant") => {
    const message = buildUnstakeMessage({
      jettonWallet: JETTON_WALLET,
      amount: 2_623_114_925n,
      owner: OWNER,
      mode,
      queryId: 7n,
    });
    const body = Cell.fromBase64(message.payload).beginParse();
    const read = {
      address: message.address,
      value: message.amount,
      op: body.loadUint(32),
      queryId: body.loadUintBig(64),
      amount: body.loadCoins(),
      owner: body.loadAddress(),
      custom: body.loadMaybeRef()?.beginParse(),
    };
    body.endParse();
    return read;
  };

  it("burns to be paid at the round end, at no fee", () => {
    const read = burn("wait");
    expect(Address.parse(read.address).toRawString()).toBe(JETTON_WALLET);
    expect(read.value).toBe("1000000000");
    expect(read.op).toBe(OP.burn);
    expect(read.queryId).toBe(7n);
    expect(read.amount).toBe(2_623_114_925n);
    expect(read.owner.equals(OWNER)).toBe(true);
    // wait_till_round_end, then fill_or_kill; the pool end_parses after them.
    expect(read.custom?.loadBit()).toBe(true);
    expect(read.custom?.loadBit()).toBe(false);
    expect(read.custom?.remainingBits).toBe(0);
  });

  it("asks for an instant payout or the KTON back", () => {
    const read = burn("instant");
    expect(read.custom?.loadBit()).toBe(false);
    expect(read.custom?.loadBit()).toBe(true);
    expect(read.custom?.remainingBits).toBe(0);
  });
});
