import { Cell } from "@ton/core";

export interface RoundPoint {
  roundId: number;
  /** Unix seconds the round completed. */
  time: number;
  totalBalance: bigint;
  supply: bigint;
}

/**
 * Parses the pool's round-completion log (`log_round_completion`, an external
 * message with no destination): round_id:uint32, borrowed:coins,
 * returned:coins, profit:(sign bit, coins), total_balance:coins, supply:coins.
 * The pool's other logs have other shapes; anything else returns null.
 */
export function parseRoundLog(
  bodyBase64: string,
  time: number,
): RoundPoint | null {
  try {
    const slice = Cell.fromBase64(bodyBase64).beginParse();
    const roundId = slice.loadUint(32);
    slice.loadCoins(); // borrowed
    slice.loadCoins(); // returned
    slice.loadBit(); // profit sign
    slice.loadCoins(); // profit
    const totalBalance = slice.loadCoins();
    const supply = slice.loadCoins();
    slice.endParse();
    if (roundId < 1 || totalBalance <= 0n || supply <= 0n) return null;
    // The share price only drifts upward from 1; a shape that happens to
    // parse but lands far from it is another log.
    const price = Number(totalBalance) / Number(supply);
    if (!(price > 0.5 && price < 5)) return null;
    return { roundId, time, totalBalance, supply };
  } catch {
    return null;
  }
}

const SECONDS_PER_YEAR = 365.25 * 86_400;

export interface RealizedApy {
  /** Yearly yield, as a fraction (0.134 is 13.4%), after the governance fee. */
  apy: number;
  /** Days the measurement spans. */
  days: number;
  fromRound: number;
  toRound: number;
}

/**
 * The yield holders actually got: the share price (total_balance / supply)
 * at the last round against the one about `days` earlier, annualized.
 * Deposits and withdrawals move both at the same price, so only earnings
 * move it. Rewards arrive every other round, so both ends are taken on
 * rounds of the same parity.
 */
export function realizedApy(
  points: RoundPoint[],
  days: number,
): RealizedApy | null {
  const byRound = new Map<number, RoundPoint>();
  for (const point of points) byRound.set(point.roundId, point);
  const sorted = [...byRound.values()].sort((a, b) => a.roundId - b.roundId);
  const last = sorted.at(-1);
  if (!last) return null;
  const since = last.time - days * 86_400;
  const first = sorted.find(
    (p) =>
      p.time >= since &&
      p.roundId < last.roundId &&
      (last.roundId - p.roundId) % 2 === 0,
  );
  if (!first) return null;

  const seconds = last.time - first.time;
  if (seconds <= 0) return null;
  const growth =
    Number(last.totalBalance) /
    Number(last.supply) /
    (Number(first.totalBalance) / Number(first.supply));
  const apy = growth ** (SECONDS_PER_YEAR / seconds) - 1;
  if (!Number.isFinite(apy)) return null;
  return {
    apy,
    days: seconds / 86_400,
    fromRound: first.roundId,
    toRound: last.roundId,
  };
}
