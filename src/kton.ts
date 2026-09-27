import { Address, beginCell } from "@ton/core";
import {
  parseRoundLog,
  type RealizedApy,
  type RoundPoint,
  realizedApy,
} from "./apy.js";
import {
  CHAIN,
  MIN_TONS_FOR_STORAGE,
  type Network,
  POOLS,
  type PoolName,
  TONCENTER,
  VALID_FOR_SECONDS,
} from "./constants.js";
import {
  buildStakeMessage,
  buildUnstakeMessage,
  type TonConnectMessage,
} from "./messages.js";
import { address, num, type PoolData, parsePoolData } from "./pool.js";
import { TonCenter } from "./toncenter.js";

/**
 * What the SDK needs of a TonConnect instance. `TonConnectUI` from
 * `@tonconnect/ui` and `TonConnect` from `@tonconnect/sdk` both fit.
 */
export interface TonConnectLike {
  readonly account: { address: string; chain: string } | null;
  sendTransaction(transaction: {
    validUntil: number;
    network?: string;
    from?: string;
    messages: TonConnectMessage[];
  }): Promise<{ boc: string }>;
}

export interface KTONOptions {
  /** Defaults to mainnet. */
  network?: Network;
  /**
   * Defaults to KTON. pKTON exists on mainnet only; its governance fee takes
   * all the rewards and its instant withdrawals are free. See the README.
   */
  pool?: PoolName;
  /** Signs stakes and unstakes; reads work without it. */
  connector?: TonConnectLike;
  /** TonCenter API key: 10 requests a second instead of 1. */
  apiKey?: string;
  /** A TonCenter v3 compatible endpoint, such as your own proxy. */
  endpoint?: string;
  /** Requests per second the endpoint allows. */
  rps?: number;
  fetch?: typeof globalThis.fetch;
}

export interface Rates {
  /** TON one KTON is worth now (total_balance / supply). */
  current: number;
  /** The same at the round end; a stake mints at this rate. */
  projected: number;
}

export interface RoundInfo {
  /** The validation round running now. */
  start: Date;
  end: Date;
  /** The pool lends every other round: whether its stake is in this one. */
  poolValidating: boolean;
}

export interface Withdrawal {
  /** The payout NFT that pays the TON at the round end. */
  nft: Address;
  /** KTON burned for it, in nano units. */
  amount: bigint;
}

export interface SentTransaction {
  /** The signed external message, as the wallet returned it. */
  boc: string;
  queryId: bigint;
}

const POOL_TTL_MS = 15_000;
const CYCLES_TTL_MS = 60_000;
const MESSAGES_PAGE = 256;
const NFT_PAGE = 1000;
const MAX_NFT_PAGES = 5;
const PAYOUT_NAME = /Withdrawal Payout/;

export class KTON {
  readonly network: Network;
  readonly pool: PoolName;
  readonly poolAddress: Address;
  connector?: TonConnectLike;
  private readonly api: TonCenter;

  constructor(options: KTONOptions = {}) {
    this.network = options.network ?? "mainnet";
    this.pool = options.pool ?? "KTON";
    const pool = POOLS[this.network][this.pool];
    if (!pool) {
      throw new Error(`${this.pool} has no pool on ${this.network}`);
    }
    this.poolAddress = Address.parse(pool);
    this.connector = options.connector;
    this.api = new TonCenter({
      endpoint: options.endpoint ?? TONCENTER[this.network],
      apiKey: options.apiKey,
      rps: options.rps,
      fetch: options.fetch,
    });
  }

  // Reads

  /** Everything `get_pool_full_data` says, cached for 15 seconds. */
  async getPoolData(): Promise<PoolData> {
    const result = await this.api.runGetMethod(
      this.poolAddress.toRawString(),
      "get_pool_full_data",
      [],
      POOL_TTL_MS,
    );
    assertExit(result.exit_code, "get_pool_full_data");
    return parsePoolData(result.stack);
  }

  /** nanotons staked in the pool. */
  async getTvl(): Promise<bigint> {
    return (await this.getPoolData()).totalBalance;
  }

  async getRates(): Promise<Rates> {
    const pool = await this.getPoolData();
    return {
      current: ratio(pool.totalBalance, pool.supply),
      projected: ratio(pool.projectedTotalBalance, pool.projectedSupply),
    };
  }

  /**
   * The yield holders actually received over about the last `days` days,
   * from the share price the pool logs at every round end. null when the
   * pool has not logged two comparable rounds in that time.
   */
  async getRealizedApy({ days = 30 } = {}): Promise<RealizedApy | null> {
    const points: RoundPoint[] = [];
    const since = Date.now() / 1000 - days * 86_400;
    // About 125 pool messages a month in 2026; more deposits mean more
    // messages, and past the cap the window measured just gets shorter.
    const maxPages = Math.min(16, Math.ceil(days / 10) + 1);
    for (let page = 0; page < maxPages; page++) {
      const { messages } = await this.api.get<{ messages: PoolMessage[] }>(
        "messages",
        {
          source: this.poolAddress.toRawString(),
          sort: "desc",
          limit: MESSAGES_PAGE,
          offset: page * MESSAGES_PAGE,
        },
        CYCLES_TTL_MS,
      );
      for (const message of messages) {
        const body = message.message_content?.body;
        if (message.destination !== null || !body) continue;
        const point = parseRoundLog(body, Number(message.created_at));
        if (point) points.push(point);
      }
      const oldest = messages.at(-1);
      if (messages.length < MESSAGES_PAGE || !oldest) break;
      if (Number(oldest.created_at) < since) break;
    }
    return realizedApy(points, days);
  }

  async getRoundInfo(): Promise<RoundInfo> {
    const [{ cycles }, pool] = await Promise.all([
      this.api.get<{ cycles: ValidatorCycle[] }>(
        "validators/cycles",
        { limit: 2 },
        CYCLES_TTL_MS,
      ),
      this.getPoolData(),
    ]);
    const now = Date.now() / 1000;
    const cycle =
      cycles.find((c) => c.cycle_start <= now && now < c.cycle_end) ??
      cycles
        .filter((c) => c.cycle_start <= now)
        .sort((a, b) => b.cycle_start - a.cycle_start)[0];
    if (!cycle) throw new Error("TonCenter listed no validation round");
    return {
      start: new Date(cycle.cycle_start * 1000),
      end: new Date(cycle.cycle_end * 1000),
      poolValidating: pool.previousRound.borrowed > 0n,
    };
  }

  /** nanotons in the wallet. */
  async getBalance(owner?: Address | string): Promise<bigint> {
    const account = await this.api.get<{ balance: string }>("account", {
      address: this.ownerOf(owner).toRawString(),
    });
    return BigInt(account.balance);
  }

  /** KTON the wallet holds, in nano units; 0 without a KTON wallet. */
  async getStakedBalance(owner?: Address | string): Promise<bigint> {
    const pool = await this.getPoolData();
    const { jetton_wallets } = await this.api.get<{
      jetton_wallets: { balance: string }[];
    }>("jetton/wallets", {
      owner_address: this.ownerOf(owner).toRawString(),
      jetton_address: pool.jettonMinter.toRawString(),
      limit: 1,
    });
    return BigInt(jetton_wallets[0]?.balance ?? "0");
  }

  /** The owner's KTON wallet, as the minter derives it (deployed or not). */
  async getJettonWallet(owner?: Address | string): Promise<Address> {
    const pool = await this.getPoolData();
    const slice = beginCell()
      .storeAddress(this.ownerOf(owner))
      .endCell()
      .toBoc()
      .toString("base64");
    const result = await this.api.runGetMethod(
      pool.jettonMinter.toRawString(),
      "get_wallet_address",
      [{ type: "slice", value: slice }],
    );
    assertExit(result.exit_code, "get_wallet_address");
    const wallet = result.stack[0] && address(result.stack[0]);
    if (!wallet) throw new Error("get_wallet_address returned no address");
    return wallet;
  }

  /**
   * Withdrawals waiting for the round end: the pool's payout NFTs the wallet
   * holds. A paid one is destroyed, so every one listed is still pending.
   */
  async getWithdrawals(owner?: Address | string): Promise<Withdrawal[]> {
    const items: NftItem[] = [];
    for (let page = 0; page < MAX_NFT_PAGES; page++) {
      const { nft_items } = await this.api.get<{ nft_items: NftItem[] }>(
        "nft/items",
        {
          owner_address: this.ownerOf(owner).toRawString(),
          limit: NFT_PAGE,
          offset: page * NFT_PAGE,
        },
      );
      items.push(...nft_items);
      if (nft_items.length < NFT_PAGE) break;
    }

    const withdrawals: Withdrawal[] = [];
    for (const item of items.filter((i) => this.isPayoutNft(i))) {
      const result = await this.api.runGetMethod(
        item.address,
        "get_bill_amount",
      );
      // An NFT the index still lists after it paid out is gone on chain.
      if (result.exit_code !== 0) continue;
      withdrawals.push({
        nft: Address.parse(item.address),
        amount: num(result.stack[0]),
      });
    }
    return withdrawals;
  }

  /**
   * nanotons the pool can pay out at once, before its instant withdrawal fee.
   * The pool pays an instant withdrawal only when it is worth less than this.
   */
  async getInstantLiquidity(): Promise<bigint> {
    const account = await this.api.get<{ balance: string }>(
      "account",
      { address: this.poolAddress.toRawString() },
      POOL_TTL_MS,
    );
    const free = BigInt(account.balance) - MIN_TONS_FOR_STORAGE;
    return free > 0n ? free : 0n;
  }

  // Transactions

  /**
   * Deposits `amount` nanotons; the wallet also attaches the 1 TON deposit
   * fee, of which about 0.997 comes back. KTON is minted at the projected
   * rate.
   */
  async stake(amount: bigint): Promise<SentTransaction> {
    assertPositive(amount);
    const pool = await this.getPoolData();
    if (pool.halted || pool.state !== 0) {
      throw new Error("The pool is not taking deposits right now");
    }
    if (!pool.depositsOpen) throw new Error("Deposits to the pool are closed");
    const queryId = randomQueryId();
    const message = buildStakeMessage({
      pool: this.poolAddress,
      amount,
      queryId,
      testnet: this.network === "testnet",
    });
    return { boc: await this.send([message]), queryId };
  }

  /**
   * Burns `amount` nano KTON for TON paid at the end of the round, at no fee.
   * The wallet receives a payout NFT meanwhile (see getWithdrawals).
   */
  unstake(amount: bigint): Promise<SentTransaction> {
    return this.burn(amount, "wait");
  }

  /**
   * Burns `amount` nano KTON for TON paid at once. The pool charges its
   * instant withdrawal fee for it, and this refuses when that fee is above
   * `maxFee` (a fraction; 0 by default). If the pool cannot pay after all,
   * it returns the KTON.
   */
  async unstakeInstant(
    amount: bigint,
    { maxFee = 0 }: { maxFee?: number } = {},
  ): Promise<SentTransaction> {
    assertPositive(amount);
    const pool = await this.getPoolData();
    if (!pool.optimisticDepositWithdrawals || pool.state !== 0) {
      throw new Error("The pool does not pay withdrawals instantly");
    }
    if (pool.instantWithdrawalFee > maxFee) {
      throw new Error(
        `An instant withdrawal costs ${(pool.instantWithdrawalFee * 100).toFixed(2)}% here, above maxFee; use unstake() to wait for the round end at no fee`,
      );
    }
    const value = (amount * pool.totalBalance) / pool.supply;
    if (value >= (await this.getInstantLiquidity())) {
      throw new Error(
        "The pool cannot pay this much at once; use unstake() to wait for the round end",
      );
    }
    return this.burn(amount, "instant");
  }

  private async burn(
    amount: bigint,
    mode: "wait" | "instant",
  ): Promise<SentTransaction> {
    assertPositive(amount);
    const owner = this.ownerOf();
    const pool = await this.getPoolData();
    if (pool.halted) throw new Error("The pool is halted");
    const staked = await this.getStakedBalance(owner);
    if (amount > staked) {
      throw new Error(`Only ${staked} nano KTON to unstake, asked ${amount}`);
    }
    const queryId = randomQueryId();
    const message = buildUnstakeMessage({
      jettonWallet: await this.getJettonWallet(owner),
      amount,
      owner,
      mode,
      queryId,
      testnet: this.network === "testnet",
    });
    return { boc: await this.send([message]), queryId };
  }

  private async send(messages: TonConnectMessage[]): Promise<string> {
    const connector = this.requireConnector();
    const { boc } = await connector.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + VALID_FOR_SECONDS,
      network: CHAIN[this.network],
      from: this.ownerOf().toRawString(),
      messages,
    });
    return boc;
  }

  private requireConnector(): TonConnectLike {
    if (!this.connector) {
      throw new Error("Pass a TonConnect connector to sign transactions");
    }
    return this.connector;
  }

  /** The address given, or the connected wallet's. */
  private ownerOf(owner?: Address | string): Address {
    if (owner) return typeof owner === "string" ? Address.parse(owner) : owner;
    const account = this.connector?.account;
    if (!account) throw new Error("No wallet connected and no address given");
    if (account.chain !== CHAIN[this.network]) {
      throw new Error(`The connected wallet is not on ${this.network}`);
    }
    return Address.parse(account.address);
  }

  private isPayoutNft(item: NftItem): boolean {
    if (!PAYOUT_NAME.test(item.content?.name ?? "")) return false;
    // Anyone can copy the name, and other pools of the same contract use it
    // too: only a collection this pool administers is its payout.
    const admin = item.collection?.owner_address;
    return !!admin && Address.parse(admin).equals(this.poolAddress);
  }
}

interface PoolMessage {
  destination: string | null;
  created_at: string;
  message_content?: { body?: string } | null;
}

interface ValidatorCycle {
  cycle_start: number;
  cycle_end: number;
}

interface NftItem {
  address: string;
  collection_address: string | null;
  content?: { name?: string } | null;
  collection?: { owner_address?: string | null } | null;
}

function ratio(balance: bigint, supply: bigint): number {
  return supply > 0n ? Number(balance) / Number(supply) : 1;
}

function assertExit(exitCode: number, method: string): void {
  if (exitCode !== 0)
    throw new Error(`${method} failed with exit code ${exitCode}`);
}

function assertPositive(amount: bigint): void {
  if (amount <= 0n) throw new RangeError("The amount must be above zero");
}

function randomQueryId(): bigint {
  const bytes = new Uint32Array(2);
  globalThis.crypto.getRandomValues(bytes);
  // 63 bits keeps it positive in any reader.
  return (BigInt((bytes[0] ?? 0) & 0x7fffffff) << 32n) | BigInt(bytes[1] ?? 0);
}
