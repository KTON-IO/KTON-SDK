import { Address, Cell } from "@ton/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { KTON, type TonConnectLike } from "../src/kton.js";
import { fakeFetch, fixture } from "./helpers.js";

const HOLDER =
  "0:2918c2d787bd5136a3af89a4a851fac843d922929d17422c4e2437d8ba255b5e";
const PKTON_HOLDER =
  "0:098cf77858a7cdf81ed6b3c50d28cc2efaa9fc2fe02a82718ca432034b9ca2b1";
/** An address that has never had a transaction. */
const NEVER_USED =
  "0:9f3e1a6b2c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7";
const PAYOUT_NFT =
  "0:71301C5480B32D8D8C1D736902B7F8F02B4115A75DCFB3F3AF8F183BE728DEBC";

/** The chain as the fixtures captured it, for the KTON or the pKTON pool. */
function chain({
  pool = "KTON",
  billAmount = "get-bill-amount",
}: {
  pool?: "KTON" | "pKTON";
  billAmount?: string;
} = {}) {
  const pkton = pool === "pKTON";
  const holder = pkton ? PKTON_HOLDER : HOLDER;
  const prefix = pkton ? "pkton-" : "";
  return fakeFetch((url, body) => {
    const path = url.pathname.replace("/api/v3/", "");
    const query = url.searchParams;
    if (path === "runGetMethod" && body) {
      if (body.method === "get_pool_full_data") {
        return fixture(`${prefix}pool-full-data`);
      }
      if (body.method === "get_wallet_address") {
        return fixture(`${prefix}get-wallet-address`);
      }
      if (body.method === "get_bill_amount") return fixture(billAmount);
    }
    if (path === "jetton/wallets") {
      return fixture(
        query.get("owner_address") === holder
          ? `${prefix}jetton-wallets-holder`
          : "jetton-wallets-none",
      );
    }
    if (path === "account") {
      const address = query.get("address");
      if (address === HOLDER) return fixture("account-holder");
      if (address === NEVER_USED) return fixture("account-nonexist");
      return fixture(`${prefix}pool-account`);
    }
    if (path === "nft/items") return fixture("nft-items-with-payout");
    if (path === "validators/cycles") return fixture("validator-cycles");
    if (path === "messages") return fixture("pool-messages");
    return undefined;
  });
}

function wallet(chainId = "-239", address = HOLDER) {
  const sendTransaction = vi.fn<TonConnectLike["sendTransaction"]>(
    async () => ({ boc: "te6signed" }),
  );
  const connector: TonConnectLike = {
    account: { address, chain: chainId },
    sendTransaction,
  };
  return { connector, sendTransaction };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("KTON", () => {
  it("reads nothing until asked", () => {
    const { fetch, calls } = chain();
    new KTON({ rps: 1000, fetch });
    expect(calls).toHaveLength(0);
  });

  it("has no pKTON pool on testnet", () => {
    expect(() => new KTON({ network: "testnet", pool: "pKTON" })).toThrow(
      /pKTON has no pool on testnet/,
    );
  });

  it("reads the pool once for several questions", async () => {
    const { fetch, calls } = chain();
    const kton = new KTON({ rps: 1000, fetch });
    const [tvl, rates] = await Promise.all([kton.getTvl(), kton.getRates()]);
    await kton.getPoolData();
    expect(tvl).toBe(0x6572267ae258an);
    expect(rates.current).toBe(
      Number(0x6572267ae258an) / Number(0x5e9c241755c3en),
    );
    expect(rates.projected).toBeLessThan(rates.current);
    expect(calls).toHaveLength(1);
  });

  it("sends the API key as a header, never in the URL", async () => {
    const { fetch, calls } = chain();
    const spy = vi.fn(fetch);
    await new KTON({ rps: 1000, fetch: spy, apiKey: "secret" }).getTvl();
    const init = spy.mock.calls[0]?.[1];
    expect(new Headers(init?.headers).get("X-API-Key")).toBe("secret");
    expect(calls[0]?.url.search).not.toContain("secret");
  });

  it("reads balances", async () => {
    const { fetch, calls } = chain();
    const kton = new KTON({ rps: 1000, fetch });
    expect(await kton.getBalance(HOLDER)).toBe(8_620_330_074n);
    expect(await kton.getBalance(NEVER_USED)).toBe(0n);
    expect(await kton.getStakedBalance(HOLDER)).toBe(2_623_114_925n);
    // No KTON wallet yet is no KTON, not an error.
    expect(await kton.getStakedBalance(`0:${"00".repeat(31)}01`)).toBe(0n);
    // The KTON minter, as the pool names it.
    const jettons = calls.filter((c) => c.url.pathname.endsWith("wallets"));
    expect(jettons[0]?.url.searchParams.get("jetton_address")).toBe(
      "0:6e2215cd36459ff405bd9a234635348efee159db77a37c85ab89e5e07b97fbdf",
    );
  });

  it("derives the KTON wallet the index knows", async () => {
    const { fetch } = chain();
    const kton = new KTON({ rps: 1000, fetch });
    const indexed = fixture<{ jetton_wallets: { address: string }[] }>(
      "jetton-wallets-holder",
    ).jetton_wallets[0]?.address;
    const derived = await kton.getJettonWallet(HOLDER);
    expect(indexed && derived.equals(Address.parse(indexed))).toBe(true);
  });

  it("lists the pool's payout NFTs with their amounts", async () => {
    const { fetch, calls } = chain();
    const withdrawals = await new KTON({ rps: 1000, fetch }).getWithdrawals(
      HOLDER,
    );
    expect(withdrawals).toHaveLength(1);
    expect(withdrawals[0]?.nft.equals(Address.parse(PAYOUT_NFT))).toBe(true);
    expect(withdrawals[0]?.amount).toBe(132_615_910n);
    // One bill per payout NFT, none for the wallet's other NFTs.
    const bills = calls.filter((c) => c.body?.method === "get_bill_amount");
    expect(bills).toHaveLength(1);
  });

  it("leaves out a payout NFT that has already paid", async () => {
    const { fetch } = chain({ billAmount: "get-bill-amount-settled" });
    expect(await new KTON({ rps: 1000, fetch }).getWithdrawals(HOLDER)).toEqual(
      [],
    );
  });

  it("finds the running round", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(1790531000 * 1000));
    const { fetch } = chain();
    const round = await new KTON({ rps: 1000, fetch }).getRoundInfo();
    expect(round.start.getTime()).toBe(1790529288 * 1000);
    expect(round.end.getTime()).toBe(1790594824 * 1000);
    expect(round.poolValidating).toBe(false);
  });

  it("measures the realized APY from the pool's logs", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(1790531000 * 1000));
    const { fetch } = chain();
    const result = await new KTON({ rps: 1000, fetch }).getRealizedApy({
      days: 20,
    });
    expect(result?.apy).toBeGreaterThan(0.1);
    expect(result?.apy).toBeLessThan(0.17);
  });

  describe("stake", () => {
    it("asks the wallet for a deposit on the right network", async () => {
      const { fetch } = chain();
      const { connector, sendTransaction } = wallet();
      const kton = new KTON({ rps: 1000, fetch, connector });
      const sent = await kton.stake(5_000_000_000n);
      expect(sent.boc).toBe("te6signed");

      const request = sendTransaction.mock.calls[0]?.[0];
      expect(request?.network).toBe("-239");
      expect(request?.from).toBe(HOLDER);
      // validUntil is in seconds, a few minutes ahead.
      const now = Date.now() / 1000;
      expect(request?.validUntil).toBeGreaterThan(now);
      expect(request?.validUntil).toBeLessThan(now + 600);
      const [message] = request?.messages ?? [];
      expect(message?.amount).toBe("6000000000");
      const body = Cell.fromBase64(message?.payload ?? "").beginParse();
      body.skip(32);
      expect(body.loadUintBig(64)).toBe(sent.queryId);
    });

    it("refuses a wallet on the other network", async () => {
      const { fetch } = chain();
      const { connector, sendTransaction } = wallet("-3");
      await expect(
        new KTON({ rps: 1000, fetch, connector }).stake(1_000_000_000n),
      ).rejects.toThrow(/not on mainnet/);
      expect(sendTransaction).not.toHaveBeenCalled();
    });

    it("refuses nothing to stake before asking the chain", async () => {
      const { fetch, calls } = chain();
      const { connector } = wallet();
      const kton = new KTON({ rps: 1000, fetch, connector });
      await expect(kton.stake(0n)).rejects.toThrow(/above zero/);
      await expect(kton.unstake(-1n)).rejects.toThrow(/above zero/);
      expect(calls).toHaveLength(0);
    });

    it("needs a connector to sign", async () => {
      const { fetch } = chain();
      await expect(new KTON({ rps: 1000, fetch }).stake(1n)).rejects.toThrow(
        /TonConnect connector/,
      );
    });
  });

  describe("unstake", () => {
    it("burns from the holder's KTON wallet, waiting for the round end", async () => {
      const { fetch } = chain();
      const { connector, sendTransaction } = wallet();
      await new KTON({ rps: 1000, fetch, connector }).unstake(1_000_000_000n);
      const [message] = sendTransaction.mock.calls[0]?.[0].messages ?? [];
      expect(Address.parse(message?.address ?? "").toRawString()).toBe(
        "0:0ab52334ce4c1d9165ccf7d18bb4eb4587dc4fbf72de637e5da0920ead22b781",
      );
      const body = Cell.fromBase64(message?.payload ?? "").beginParse();
      body.skip(32 + 64);
      body.loadCoins();
      body.loadAddress();
      expect(body.loadMaybeRef()?.beginParse().loadBit()).toBe(true);
    });

    it("refuses more KTON than the wallet holds", async () => {
      const { fetch } = chain();
      const { connector, sendTransaction } = wallet();
      await expect(
        new KTON({ rps: 1000, fetch, connector }).unstake(3_000_000_000n),
      ).rejects.toThrow(/Only 2623114925 nano KTON/);
      expect(sendTransaction).not.toHaveBeenCalled();
    });

    it("refuses an instant withdrawal the fee would swallow", async () => {
      const { fetch } = chain();
      const { connector, sendTransaction } = wallet();
      await expect(
        new KTON({ rps: 1000, fetch, connector }).unstakeInstant(
          1_000_000_000n,
        ),
      ).rejects.toThrow(/costs 100\.00%/);
      expect(sendTransaction).not.toHaveBeenCalled();
    });

    it("pays instantly where the pool charges no fee and has the TON", async () => {
      // pKTON: no instant fee, and 11.7 TON on its account, 1.7 of it free.
      const { fetch } = chain({ pool: "pKTON" });
      const { connector, sendTransaction } = wallet("-239", PKTON_HOLDER);
      const kton = new KTON({ rps: 1000, fetch, connector, pool: "pKTON" });
      expect(await kton.getInstantLiquidity()).toBe(1_732_062_511n);

      await kton.unstakeInstant(1_000_000_000n);
      const [message] = sendTransaction.mock.calls[0]?.[0].messages ?? [];
      expect(Address.parse(message?.address ?? "").toRawString()).toBe(
        "0:054fe69c749bfb5c630b73cb1560898c5f68860053446c651e04e9748d4eb9f0",
      );
      const body = Cell.fromBase64(message?.payload ?? "").beginParse();
      body.skip(32 + 64);
      body.loadCoins();
      body.loadAddress();
      const custom = body.loadMaybeRef()?.beginParse();
      expect(custom?.loadBit()).toBe(false);
      expect(custom?.loadBit()).toBe(true);
    });

    it("refuses an instant withdrawal the pool cannot pay", async () => {
      const { fetch } = chain({ pool: "pKTON" });
      const { connector, sendTransaction } = wallet("-239", PKTON_HOLDER);
      const kton = new KTON({ rps: 1000, fetch, connector, pool: "pKTON" });
      await expect(kton.unstakeInstant(5_000_000_000n)).rejects.toThrow(
        /cannot pay this much at once/,
      );
      expect(sendTransaction).not.toHaveBeenCalled();
    });
  });
});
