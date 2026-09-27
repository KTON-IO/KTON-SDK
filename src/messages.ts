import { Address, beginCell } from "@ton/core";
import { DEPOSIT_FEE, OP, WITHDRAWAL_FEE } from "./constants.js";

/** One message of a TonConnect `sendTransaction` request. */
export interface TonConnectMessage {
  /** Destination, user-friendly and bounceable. */
  address: string;
  /** nanotons, as a decimal string. */
  amount: string;
  /** Message body, a base64 bag of cells. */
  payload: string;
}

export interface StakeMessageInput {
  pool: Address | string;
  /** nanotons to stake. The deposit fee is added on top. */
  amount: bigint;
  queryId?: bigint;
  testnet?: boolean;
}

/**
 * A deposit to the pool: `op, query_id`, carrying the amount plus the 1 TON
 * deposit fee. The pool mints KTON for exactly `amount`.
 */
export function buildStakeMessage({
  pool,
  amount,
  queryId = 0n,
  testnet = false,
}: StakeMessageInput): TonConnectMessage {
  if (amount <= 0n) throw new RangeError("Stake amount must be positive");
  const body = beginCell()
    .storeUint(OP.deposit, 32)
    .storeUint(queryId, 64)
    .endCell();
  return {
    address: friendly(pool, testnet),
    amount: (amount + DEPOSIT_FEE).toString(),
    payload: body.toBoc().toString("base64"),
  };
}

export interface UnstakeMessageInput {
  /** The owner's KTON wallet, which burns the jettons. */
  jettonWallet: Address | string;
  /** KTON to burn, in nano units. */
  amount: bigint;
  /** Where the TON (or the payout NFT) goes: the owner. */
  owner: Address | string;
  /**
   * "wait" asks for the TON at the end of the round, at no fee.
   * "instant" asks the pool to pay now, at its instant withdrawal fee, and to
   * give the KTON back if it cannot.
   */
  mode: "wait" | "instant";
  queryId?: bigint;
  testnet?: boolean;
}

/**
 * A burn of pool jettons. Its custom payload is two bits the pool reads:
 * wait till the round ends, and fill or kill.
 */
export function buildUnstakeMessage({
  jettonWallet,
  amount,
  owner,
  mode,
  queryId = 0n,
  testnet = false,
}: UnstakeMessageInput): TonConnectMessage {
  if (amount <= 0n) throw new RangeError("Unstake amount must be positive");
  const instant = mode === "instant";
  const customPayload = beginCell()
    .storeBit(!instant) // wait_till_round_end
    .storeBit(instant) // fill_or_kill
    .endCell();
  const body = beginCell()
    .storeUint(OP.burn, 32)
    .storeUint(queryId, 64)
    .storeCoins(amount)
    .storeAddress(toAddress(owner))
    .storeMaybeRef(customPayload)
    .endCell();
  return {
    address: friendly(jettonWallet, testnet),
    amount: WITHDRAWAL_FEE.toString(),
    payload: body.toBoc().toString("base64"),
  };
}

function toAddress(value: Address | string): Address {
  return typeof value === "string" ? Address.parse(value) : value;
}

function friendly(value: Address | string, testnet: boolean): string {
  return toAddress(value).toString({ bounceable: true, testOnly: testnet });
}
