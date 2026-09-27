import { Address, Cell } from "@ton/core";
import { describe, expect, it, vi } from "vitest";
import { KTON } from "./kton";

// 1.1.3: the burn must ask the pool to wait for the round end. With the wait
// bit clear the pool withdraws at once when it can, and the KTON pool charges
// 100% for that.
function waitBits(payload: string) {
  const body = Cell.fromBase64(payload).beginParse();
  body.loadUint(32); // op
  body.loadUint(64); // query id
  body.loadCoins(); // amount
  body.loadAddress(); // response address
  const custom = body.loadMaybeRef()!.beginParse();
  return { waitTillRoundEnd: custom.loadBit(), fillOrKill: custom.loadBit() };
}

function sdkWithWallet() {
  const sdk = Object.create(KTON.prototype) as KTON & Record<string, unknown>;
  sdk.walletAddress = Address.parse(
    "EQA9HwEZD_tONfVz6lJS0PVKR5viEiEGyj9AuQewGQVnXPg0"
  );
  (KTON as unknown as Record<string, unknown>).jettonWalletAddress =
    Address.parse("EQA9HwEZD_tONfVz6lJS0PVKR5viEiEGyj9AuQewGQVnXPg0");
  const sent: { validUntil: number; messages: { payload: string }[] }[] = [];
  sdk.connector = { sendTransaction: async (tx: never) => sent.push(tx) };
  return { sdk, sent };
}

describe("unstake (1.1.3)", () => {
  it("always waits for the round end", async () => {
    const { sdk, sent } = sdkWithWallet();
    await sdk.unstake(1);
    expect(waitBits(sent[0]!.messages[0]!.payload)).toEqual({
      waitTillRoundEnd: true,
      fillOrKill: false,
    });
    // TonConnect wants unix seconds.
    expect(sent[0]!.validUntil).toBeLessThan(Date.now() / 1000 + 3600);
    expect(sent[0]!.validUntil).toBeGreaterThan(Date.now() / 1000);
  });

  it("refuses an instant unstake when the pool charges for it", async () => {
    const { sdk, sent } = sdkWithWallet();
    sdk.fetchStakingPoolInfo = vi.fn(async () => ({
      instantWithdrawalFee: 0xffffff,
    })) as never;
    await expect(sdk.unstakeInstant(1)).rejects.toThrow(/100\.00%/);
    expect(sent).toHaveLength(0);
  });
});
