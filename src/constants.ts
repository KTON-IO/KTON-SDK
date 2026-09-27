export type Network = "mainnet" | "testnet";
export type PoolName = "KTON" | "pKTON";

/** Liquid staking pools, by network. pKTON has no testnet deployment. */
export const POOLS: Record<Network, Partial<Record<PoolName, string>>> = {
  mainnet: {
    KTON: "EQA9HwEZD_tONfVz6lJS0PVKR5viEiEGyj9AuQewGQVnXPg0",
    pKTON: "EQDsW2P6nuP1zopKoNiCYj2xhqDan0cBuULQ8MH4o7dBt_7a",
  },
  testnet: {
    KTON: "kQD2y9eUotYw7VprrD0UJvAigDVXwgCCLWAl-DjaamCHniVr",
  },
};

export const TONCENTER: Record<Network, string> = {
  mainnet: "https://toncenter.com/api/v3",
  testnet: "https://testnet.toncenter.com/api/v3",
};

/** TonConnect chain ids. */
export const CHAIN: Record<Network, string> = {
  mainnet: "-239",
  testnet: "-3",
};

export const OP = {
  /** pool::deposit */
  deposit: 0x47d54391,
  /** jetton::burn */
  burn: 0x595f07bc,
} as const;

/** 1 TON in nanotons. */
export const ONE_TON = 1_000_000_000n;

/**
 * The pool keeps `msg_value - DEPOSIT_FEE` as the deposit and spends the fee on
 * the mint; about 0.997 TON of it comes back in the same trace.
 */
export const DEPOSIT_FEE = ONE_TON;

/**
 * Attached to a burn. The pool requires more than 0.5 TON and returns what the
 * payout does not spend.
 */
export const WITHDRAWAL_FEE = ONE_TON;

/** The pool never lets its balance fall below this (pool.func). */
export const MIN_TONS_FOR_STORAGE = 10n * ONE_TON;

/** Fees and shares in pool data are fractions of 2^24. */
export const SHARE_BASIS = 2 ** 24;

/** How long a wallet may take to sign, in seconds. */
export const VALID_FOR_SECONDS = 5 * 60;
