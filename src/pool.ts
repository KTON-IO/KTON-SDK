import { type Address, Cell } from "@ton/core";
import { SHARE_BASIS } from "./constants.js";
import type { StackEntry } from "./toncenter.js";

export interface RoundLoans {
  roundId: number;
  /** Controllers holding a loan. */
  activeBorrowers: number;
  /** nanotons lent. */
  borrowed: bigint;
  /** nanotons expected back, with interest. */
  expected: bigint;
  /** nanotons returned so far. */
  returned: bigint;
  /** nanotons earned so far (negative on a loss). */
  profit: bigint;
}

export interface PoolData {
  /** 0 is normal; anything else and deposits are refused. */
  state: number;
  halted: boolean;
  /** nanotons the pool holds and has lent, at the last round end. */
  totalBalance: bigint;
  /** Pool jettons (KTON) in circulation, in nano units. */
  supply: bigint;
  /** totalBalance and supply as they will be at the round end, loans repaid. */
  projectedTotalBalance: bigint;
  projectedSupply: bigint;
  /** Interest the pool asks of controllers per round, as a fraction. */
  interestRate: number;
  /** Share of the profit the protocol keeps, as a fraction. */
  governanceFee: number;
  /** Deposits mint at once and withdrawals may pay at once. */
  optimisticDepositWithdrawals: boolean;
  depositsOpen: boolean;
  /** Fee on an instant withdrawal, as a fraction (1 means all of it). */
  instantWithdrawalFee: number;
  /** Loans of the round that is validating now (empty while the pool rests). */
  previousRound: RoundLoans;
  /** Loans handed out for the next round. */
  currentRound: RoundLoans;
  /** The pool's jetton (KTON) minter. */
  jettonMinter: Address;
  /** nanotons deposited this round and waiting to be minted, when not optimistic. */
  requestedForDeposit: bigint;
  /** Pool jettons burned this round and waiting to be paid out. */
  requestedForWithdrawal: bigint;
  depositPayout: Address | null;
  withdrawalPayout: Address | null;
}

/** Parses `get_pool_full_data` as TonCenter v3 returns it. */
export function parsePoolData(stack: StackEntry[]): PoolData {
  // Older pools return 30 values: no instant withdrawal fee, no accrued
  // governance fee, disbalance tolerance or credit start.
  const current = stack.length === 34;
  if (!current && stack.length !== 30) {
    throw new Error(
      `Unexpected get_pool_full_data: ${stack.length} values on the stack`,
    );
  }
  let i = 0;
  const next = () => {
    const entry = stack[i++];
    if (!entry) throw new Error("get_pool_full_data ended early");
    return entry;
  };

  const state = Number(num(next()));
  const halted = num(next()) !== 0n;
  const totalBalance = num(next());
  const interestRate = Number(num(next())) / SHARE_BASIS;
  const optimisticDepositWithdrawals = num(next()) !== 0n;
  const depositsOpen = num(next()) !== 0n;
  const instantWithdrawalFee = current ? Number(num(next())) / SHARE_BASIS : 0;
  next(); // saved_validator_set_hash
  const previousRound = round(next());
  const currentRound = round(next());
  next(); // min_loan_per_validator
  next(); // max_loan_per_validator
  const governanceFee = Number(num(next())) / SHARE_BASIS;
  if (current) {
    next(); // accrued_governance_fee
    next(); // disbalance_tolerance
    next(); // credit_start_prior_elections_end
  }
  const jettonMinter = address(next());
  if (!jettonMinter) throw new Error("get_pool_full_data has no jetton minter");
  const supply = num(next());
  const depositPayout = address(next());
  const requestedForDeposit = num(next());
  const withdrawalPayout = address(next());
  const requestedForWithdrawal = num(next());
  // sudoer, sudoer_set_at, governor, governor_update_after, interest_manager,
  // halter, approver, controller_code, pool_jetton_wallet_code,
  // payout_minter_code
  i += 10;
  const projectedTotalBalance = num(next());
  const projectedSupply = num(next());

  return {
    state,
    halted,
    totalBalance,
    supply,
    projectedTotalBalance,
    projectedSupply,
    interestRate,
    governanceFee,
    optimisticDepositWithdrawals,
    depositsOpen,
    instantWithdrawalFee,
    previousRound,
    currentRound,
    jettonMinter,
    requestedForDeposit,
    requestedForWithdrawal,
    depositPayout,
    withdrawalPayout,
  };
}

/** A stack number. TonCenter writes them as hex, with a sign: "-0x1". */
export function num(entry: StackEntry | undefined): bigint {
  if (entry?.type !== "num") {
    throw new Error(`Expected a number on the stack, got ${entry?.type}`);
  }
  const { value } = entry;
  return value.startsWith("-") ? -BigInt(value.slice(1)) : BigInt(value);
}

/** A cell or slice holding one address; an empty list is a null address. */
export function address(entry: StackEntry): Address | null {
  if (entry.type === "list" || entry.type === "tuple") return null;
  if (entry.type !== "cell" && entry.type !== "slice") {
    throw new Error(`Expected an address on the stack, got ${entry.type}`);
  }
  return Cell.fromBase64(entry.value).beginParse().loadMaybeAddress();
}

function round(entry: StackEntry): RoundLoans {
  if (entry.type !== "tuple") {
    throw new Error(`Expected a round tuple on the stack, got ${entry.type}`);
  }
  const [, roundId, activeBorrowers, borrowed, expected, returned, profit] =
    entry.value;
  return {
    roundId: Number(num(roundId)),
    activeBorrowers: Number(num(activeBorrowers)),
    borrowed: num(borrowed),
    expected: num(expected),
    returned: num(returned),
    profit: num(profit),
  };
}
