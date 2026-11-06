import { MIN_TONS_FOR_STORAGE, ONE_TON } from "./constants.js";
import type { PoolData } from "./pool.js";

/** How a withdrawal is asked for: paid at the round end, or at once. */
export type WithdrawalMode = "wait" | "instant";

/** What the pool would do with a burn of `amount`, worked out before it is sent. */
export interface WithdrawalCheck {
  mode: WithdrawalMode;
  /** Whether the pool would take it. If not, the burned KTON is minted back. */
  accepted: boolean;
  /** Why not, when it would not. */
  reason?:
    | "halted"
    | "not-optimistic"
    | "no-liquidity"
    | "queue-too-large"
    | "too-small"
    | "rotation-pending";
  /** nanotons the KTON is worth: now for "instant", at the round end for "wait" (an estimate). */
  value: bigint;
  /** nanotons the pool keeps for an instant withdrawal; 0 for "wait". */
  fee: bigint;
  /** nanotons the owner receives (value minus fee). */
  receive: bigint;
  /** The most nano KTON the pool would take in this mode right now (0 when it takes none). */
  limit: bigint;
}

export interface WithdrawalCheckOptions {
  /**
   * The pool's validator set has changed and its rotation has not run yet
   * (`get_pool_full_data` already shows the rotated state, its balance does
   * not yet show what the rotation pays out). Nothing is predicted then.
   */
  rotationPending?: boolean;
}

/** Fees and shares in pool data are fractions of 2^24 (as the contract keeps them). */
const SHARE = 2 ** 24;
const share = (amount: bigint, fraction: number) =>
  (amount * BigInt(Math.round(fraction * SHARE))) / BigInt(SHARE);
const atLeastZero = (value: bigint) => (value > 0n ? value : 0n);
const smaller = (a: bigint, b: bigint) => (a < b ? a : b);

/**
 * Whether a burn of `amount` nano KTON would go through, as the pool decides it
 * (pool.func, `withdraw`): an instant payout needs the pool's free balance
 * (`poolBalance` less the 10 TON it keeps) to exceed the KTON's worth at
 * today's rate; and either way, what the pool will hold at the next round end
 * (free balance plus the previous round's loans, less 1 TON) must cover every
 * queued withdrawal at the projected rate. A burn that fails this is minted
 * back, so nothing is lost, but the fees for the round trip are, and a queued
 * request is not made. The pool settles it with the balance it has when the
 * burn arrives, which may have changed; an instant `limit` keeps 1 TON in hand
 * for that.
 */
export function checkWithdrawal(
  pool: PoolData,
  /** The pool contract's balance, nanotons. */
  poolBalance: bigint,
  /** nano KTON to burn. */
  amount: bigint,
  mode: WithdrawalMode,
  options: WithdrawalCheckOptions = {},
): WithdrawalCheck {
  const available = atLeastZero(poolBalance - MIN_TONS_FOR_STORAGE);
  const atRoundEnd = (free: bigint) =>
    atLeastZero(free + pool.previousRound.borrowed - ONE_TON);
  const projected = (
    jettons: bigint,
    total = pool.projectedTotalBalance,
    supply = pool.projectedSupply,
  ) => (supply > 0n ? (jettons * total) / supply : 0n);
  const fromProjected = (tons: bigint) =>
    pool.projectedTotalBalance > 0n
      ? (tons * pool.projectedSupply) / pool.projectedTotalBalance
      : 0n;
  const refuse = (
    base: Omit<WithdrawalCheck, "accepted" | "reason">,
    reason: NonNullable<WithdrawalCheck["reason"]>,
  ): WithdrawalCheck => ({
    ...base,
    accepted: false,
    reason,
    limit:
      reason === "halted" ||
      reason === "rotation-pending" ||
      reason === "not-optimistic"
        ? 0n
        : base.limit,
  });

  if (mode === "instant") {
    const value =
      pool.supply > 0n ? (amount * pool.totalBalance) / pool.supply : 0n;
    const fee = share(value, pool.instantWithdrawalFee);
    // The most it could pay at once: below the free balance, leaving the queue
    // covered, with 1 TON in hand for what changes before the burn arrives.
    const byQueue =
      atRoundEnd(available) - projected(pool.requestedForWithdrawal);
    const cap = smaller(byQueue, available - ONE_TON);
    const limit =
      pool.totalBalance > 0n
        ? atLeastZero((atLeastZero(cap) * pool.supply) / pool.totalBalance)
        : 0n;
    const base = { mode, value, fee, receive: value - fee, limit };
    if (pool.halted) return refuse(base, "halted");
    if (options.rotationPending) return refuse(base, "rotation-pending");
    if (!pool.optimisticDepositWithdrawals || pool.state !== 0) {
      return refuse(base, "not-optimistic");
    }
    if (value === 0n) return refuse(base, "too-small");
    if (available <= value) return refuse(base, "no-liquidity");
    // The pool checks the queue after paying: with the balance, the supply
    // and so the projected rate as they are once this is paid.
    const queuedAfter = projected(
      pool.requestedForWithdrawal,
      pool.projectedTotalBalance - value,
      pool.projectedSupply - amount,
    );
    if (atRoundEnd(available - value) < queuedAfter) {
      return refuse(base, "queue-too-large");
    }
    return { ...base, accepted: true };
  }

  const value = projected(amount);
  const limit = atLeastZero(
    fromProjected(atRoundEnd(available)) - pool.requestedForWithdrawal,
  );
  const base = { mode, value, fee: 0n, receive: value, limit };
  if (pool.halted) return refuse(base, "halted");
  if (options.rotationPending) return refuse(base, "rotation-pending");
  if (value === 0n) return refuse(base, "too-small");
  if (atRoundEnd(available) < projected(pool.requestedForWithdrawal + amount)) {
    return refuse(base, "queue-too-large");
  }
  return { ...base, accepted: true };
}
