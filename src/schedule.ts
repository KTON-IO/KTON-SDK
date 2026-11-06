/**
 * When the pool pays, worked out from the chain's validation cycle. Pure: the
 * same reckoning the KTON app and its Telegram bot use, so the times agree.
 */

const HOUR_MS = 3_600_000;

/**
 * The start of a validation round the pool is known to have lent in; parity
 * against it tells a participating round from a resting one.
 */
export const VALIDATION_ROUND_BEGIN_REFERENCE_UTIMES = {
  // About when the first validation round the mainnet pool lent in began
  // (validator round times, the same as config param 34 gives).
  mainnet: 1742950152,
  // A round start only: the testnet pool does not lend, so which testnet
  // rounds are "participating" is arbitrary and the testnet schedule is not
  // meaningful.
  testnet: 1744306315,
};

/**
 * Hours added before a new withdrawal request is counted on a rotation: the
 * time of the loan repayment cannot be guaranteed, so a rotation that is too
 * close is not promised.
 */
export const UNSTAKE_MARGIN_HOURS = 1;

/** The fields of TonCenter's /validators/cycles entries this needs. */
export interface CycleTimes {
  cycle_start: number;
  cycle_end: number;
  validators_elected_for: number;
  stake_held_for: number;
  elections_start_before?: number | null;
  elections_end_before?: number | null;
}

/**
 * Pick the validation cycle active at `nowSec`. Around elections the indexer can
 * list the next, not-yet-active set first, so `[0]` is not assumed current. If
 * none contains now (the new round started but is not indexed yet), use the
 * newest one that has started, until the index catches up.
 */
export function selectActiveCycle<
  T extends Pick<CycleTimes, "cycle_start" | "cycle_end">,
>(cycles: T[], nowSec: number): T | null {
  const active = cycles.find(
    (c) => c.cycle_start <= nowSec && nowSec < c.cycle_end,
  );
  if (active) return active;
  const started = cycles
    .filter((c) => c.cycle_start <= nowSec)
    .sort((a, b) => b.cycle_start - a.cycle_start);
  return started[0] ?? null;
}

/**
 * Turn the active validation cycle into the round the pool is accruing in. The
 * pool lends every other round; parity against a known participating round
 * (tRef) tells them apart. While resting, the round it will participate in
 * begins right as this one ends. Pure, so it is tested against a captured
 * /validators/cycles response.
 */
export function roundInfoFromCycle(cycle: CycleTimes, tRef: number) {
  const begin = cycle.cycle_start;
  const end = cycle.cycle_end;
  const validationDuration = end - begin;
  const roundDiff = (begin - tRef) / validationDuration;
  const isParticipating = Math.round(roundDiff) % 2 === 0;
  const timeOffset = isParticipating ? 0 : validationDuration;
  return {
    begin: new Date((begin + timeOffset) * 1000),
    end: new Date((end + timeOffset) * 1000),
    roundDiff,
    isParticipating,
    validatorsElectedFor: cycle.validators_elected_for,
    electionsStartBefore: cycle.elections_start_before ?? 0,
    electionsEndBefore: cycle.elections_end_before ?? 0,
    stakeHeldFor: cycle.stake_held_for,
    roundSecondTime: cycle.validators_elected_for + cycle.stake_held_for,
  };
}

/** What roundInfoFromCycle gives, as far as the schedule needs it. */
export interface RoundTimes {
  begin?: Date | null;
  end?: Date | null;
  stakeHeldFor?: number | null;
  validatorsElectedFor?: number | null;
  isParticipating?: boolean | null;
}

export interface PayoutBases {
  isParticipating: boolean;
  midRestPayoutMs: number;
  postParticipationPayoutMs: number;
  rotationsMs: number[];
  shortGapMs: number;
  longGapMs: number;
  cycleDurationMs: number;
}

/**
 * The moments of one pool cycle that do not depend on the clock. On chain: a
 * participating round ends, the stake is released `stakeHeldFor` seconds
 * later, and the rate steps up. A whole cycle is two rounds (about 36.4 hours
 * with mainnet's 65,536-second rounds).
 */
export function payoutBases(
  round: RoundTimes | null | undefined,
): PayoutBases | null {
  if (
    !round?.begin ||
    !round?.end ||
    !round?.stakeHeldFor ||
    !round?.validatorsElectedFor
  ) {
    return null;
  }
  const shiftedBeginMs = new Date(round.begin).getTime();
  const shiftedEndMs = new Date(round.end).getTime();
  const stakeHeldForMs = round.stakeHeldFor * 1000;
  const validDurationMs = round.validatorsElectedFor * 1000;
  const isParticipating = !!round.isParticipating;
  // roundInfoFromCycle moves a resting round's begin and end forward by one
  // round, so the resting round itself began at shiftedBegin - validDuration.
  const midRestPayoutMs = shiftedBeginMs - validDurationMs + stakeHeldForMs;
  const postParticipationPayoutMs = shiftedEndMs + stakeHeldForMs;

  // Withdrawals are paid at every pool rotation, not only the one that moves
  // the rate: the unlock after a participating round, then the end of the
  // rest round that follows it (round logs alternate about 9h and 27h
  // apart). While resting, the shifted begin is the rest round's own end.
  // Later entries cover round data that lags behind the clock.
  // The two gaps between rotations. The pool lends every other round, so a
  // cycle has a short leg (round minus unlock) and a long one (round plus
  // it); 146 logged rotations agreed with this to the minute.
  const shortGapMs = validDurationMs - stakeHeldForMs;
  const longGapMs = validDurationMs + stakeHeldForMs;
  const rotationsMs = [
    ...(isParticipating ? [] : [midRestPayoutMs, shiftedBeginMs]),
    postParticipationPayoutMs,
    shiftedEndMs + validDurationMs,
  ];
  return {
    isParticipating,
    midRestPayoutMs,
    postParticipationPayoutMs,
    rotationsMs,
    shortGapMs,
    longGapMs,
    cycleDurationMs: 2 * validDurationMs,
  };
}

/**
 * The pool's next moments as of `now`. `nextPayoutMs` is when the rate
 * actually steps up, **not** when the validation round ends.
 */
export function payoutSchedule(
  bases: PayoutBases,
  now: number,
  unstakeMarginHours: number,
) {
  const cycle = bases.cycleDurationMs;
  /**
   * The first occurrence of a scheduled moment after `ms`. The pool's
   * schedule repeats every cycle, so when the round data trails the clock (the
   * index behind the chain) a moment that has gone by is the same point in a
   * later cycle, not a date in the past.
   */
  const after = (scheduled: number, ms: number) =>
    scheduled > ms
      ? scheduled
      : scheduled + (Math.floor((ms - scheduled) / cycle) + 1) * cycle;

  const nextPayoutMs = after(
    bases.isParticipating
      ? bases.postParticipationPayoutMs
      : now < bases.midRestPayoutMs
        ? bases.midRestPayoutMs
        : bases.postParticipationPayoutMs,
    now,
  );

  // A new stake is minted at a price that already counts the profit of the
  // loans still out (pool.func `_get_projected_conversion_ratio` reads
  // `prev_round_borrowers`), so while any are out it sits out the next payout
  // and first earns the one after. They are out from the start of a
  // participating round to the payout after it: the round plus the unlock,
  // which is the long rotation gap. Read from the phase, so it holds when the
  // times above were carried forward too.
  const loansOut = nextPayoutMs - now <= bases.longGapMs;
  const firstPayoutForNewStakeMs = loansOut
    ? nextPayoutMs + cycle
    : nextPayoutMs;

  const rotationAfter = (ms: number) =>
    Math.min(...bases.rotationsMs.map((rotation) => after(rotation, ms)));
  const nextRotationMs = rotationAfter(now);
  // A burn that reaches the pool after the rotation has started is booked
  // for the one after it, so a new request skips a rotation that is too close.
  const marginMs = unstakeMarginHours * HOUR_MS;
  const unstakeArrivalMs = rotationAfter(now + marginMs);

  return {
    nextPayoutMs,
    firstPayoutForNewStakeMs,
    nextRotationMs,
    unstakeArrivalMs,
    /**
     * When a request sent at `requestedAtMs` is paid: the first rotation it
     * could still make, or the next one from now if that already passed
     * (a round that ran late).
     */
    arrivalForRequestMs: (requestedAtMs: number) =>
      Math.max(rotationAfter(requestedAtMs + marginMs), nextRotationMs),
  };
}
