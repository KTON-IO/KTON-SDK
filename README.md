# KTON SDK

Stake TON in the [KTON](https://kton.io) liquid staking pool from any web app.
The SDK reads the pool and wallets from TonCenter and builds the transactions
your users sign with TonConnect.

[![npm](https://img.shields.io/npm/v/kton-sdk)](https://www.npmjs.com/package/kton-sdk)
[![CI](https://github.com/KTON-IO/KTON-SDK/actions/workflows/ci.yml/badge.svg)](https://github.com/KTON-IO/KTON-SDK/actions/workflows/ci.yml)

[Live demo](https://kton-io.github.io/KTON-SDK/)

## Install

```bash
npm install kton-sdk @ton/core
```

`@ton/core` is a peer dependency, so the SDK shares your app's copy. In the
browser, `@ton/core` needs a `Buffer` global, which most TON apps already
provide.

Without a bundler, load the single-file build. It includes `@ton/core` and a
`Buffer`, and exposes `window.KTONSDK`:

```html
<script src="https://cdn.jsdelivr.net/npm/kton-sdk@2/dist/kton-sdk.global.js"></script>
```

## Quick start

```ts
import { TonConnectUI } from "@tonconnect/ui";
import { KTON, fromNano, toNano } from "kton-sdk";

const tonConnect = new TonConnectUI({ manifestUrl: "https://example.com/tonconnect-manifest.json" });
const kton = new KTON({ connector: tonConnect });

// Pool
const rates = await kton.getRates(); // { current: 1.0722, projected: 1.0728 } TON per KTON
const apy = await kton.getRealizedApy(); // { apy: 0.1342, days: 28.8, ... }

// The connected wallet
const staked = await kton.getStakedBalance(); // nano KTON
console.log(`${fromNano(staked)} KTON`);

// Transactions, signed in the user's wallet
await kton.stake(toNano("10"));
await kton.unstake(toNano("5"));
```

Amounts are always `bigint` in nano units (1 TON = 10^9). Use `toNano` and
`fromNano`, exported from the SDK, to convert.

## Options

```ts
new KTON({
  network: "mainnet", // or "testnet"
  pool: "KTON", // or "pKTON" (mainnet only)
  connector, // a TonConnectUI or TonConnect instance; only needed to sign
  apiKey, // TonCenter API key: 10 requests a second instead of 1
  endpoint, // any TonCenter v3 compatible endpoint, such as your own proxy
  rps, // requests per second that endpoint allows
});
```

The constructor makes no network calls. Reads work without a connector: pass
an address to the wallet methods instead.

Without an API key TonCenter allows one request a second, and the SDK queues
requests to stay under it. Get a key from
[@tonapibot](https://t.me/tonapibot) for anything beyond a demo, and keep it
off public pages by serving TonCenter through your own proxy (`endpoint`).

## Reading

| Method | Returns |
| --- | --- |
| `getPoolData()` | Everything `get_pool_full_data` reports: balances, fees, round loans, deposit and withdrawal state. Cached for 15 seconds. |
| `getTvl()` | nanotons staked in the pool |
| `getRates()` | TON per KTON, `current` and `projected` (the round end rate, which a stake mints at) |
| `getRealizedApy({ days })` | The yield holders actually received over about `days` days (30 by default), from the share price the pool logs every round, after the governance fee. `null` without enough rounds. It reads a few pages of the pool's messages: about 3 seconds without an API key. |
| `getRoundInfo()` | The validation round running now (`start`, `end`) and whether the pool's stake is in it (`poolValidating`); the pool lends every other round |
| `getBalance(address?)` | nanotons in the wallet |
| `getStakedBalance(address?)` | nano KTON in the wallet, `0n` if it has none |
| `getJettonWallet(address?)` | The wallet's KTON jetton wallet address |
| `getWithdrawals(address?)` | Withdrawals waiting for the round end: `{ nft, amount }` for each payout NFT the wallet holds |
| `getInstantLiquidity()` | nanotons the pool could pay out at once |

`address` defaults to the connected wallet.

## Transactions

Each returns `{ boc, queryId }` once the wallet has signed, and throws if the
user declines.

- `stake(amount)` deposits `amount` nanotons. The wallet also attaches the
  pool's 1 TON deposit fee, of which about 0.997 TON comes back in the same
  transaction. KTON is minted at once at the projected rate while the pool
  runs optimistic deposits (`getPoolData().optimisticDepositWithdrawals`, on
  for both pools); otherwise the pool mints at the round end.
- `unstake(amount)` burns `amount` nano KTON. The TON arrives at the end of the
  round, at no fee; meanwhile the wallet holds a payout NFT
  (`getWithdrawals`). The wallet attaches 1 TON for the fees and gets most of
  it back.
- `unstakeInstant(amount, { maxFee })` asks the pool to pay at once. The pool
  charges its instant withdrawal fee for it, and the SDK refuses when that fee
  is above `maxFee` (a fraction, `0` by default) or when the pool does not
  hold enough TON. **The KTON pool's instant withdrawal fee is 100%**, so on
  KTON this always refuses; use `unstake`.

For your own transaction flow, build the messages yourself:

```ts
import { buildStakeMessage, buildUnstakeMessage } from "kton-sdk";

const message = buildStakeMessage({ pool: kton.poolAddress, amount: toNano("10") });
await tonConnect.sendTransaction({ validUntil: Math.floor(Date.now() / 1000) + 300, messages: [message] });
```

## Pools

| Pool | Network | Address |
| --- | --- | --- |
| KTON | mainnet | `EQA9HwEZD_tONfVz6lJS0PVKR5viEiEGyj9AuQewGQVnXPg0` |
| KTON | testnet | `kQD2y9eUotYw7VprrD0UJvAigDVXwgCCLWAl-DjaamCHniVr` |
| pKTON | mainnet | `EQDsW2P6nuP1zopKoNiCYj2xhqDan0cBuULQ8MH4o7dBt_7a` |

Both run the TON Foundation
[liquid staking contract](https://github.com/ton-blockchain/liquid-staking-contract).

## Upgrading from 1.x

Version 2 is a rewrite. Do not use 1.1.2 or earlier: their `unstake()` could
withdraw instantly at the KTON pool's 100% fee (see the
[changelog](CHANGELOG.md)).

- Amounts are `bigint` nano units, not `number` TON: `stake(10)` becomes
  `stake(toNano("10"))`, and balances come back as `bigint`.
- Options: `isTestnet: true` is `network: "testnet"`, `tokenType` is `pool`,
  `tonApiKey` is `apiKey` (a TonCenter key now). `cacheFor` and `partnerCode`
  are gone.
- The connector needs `account` and `sendTransaction` only, which TonConnectUI
  and TonConnect both have. It is optional for reads.
- No setup: no `initialized` event, no `switchTokenType()`. Create one `KTON`
  per pool.
- Renamed: `fetchStakingPoolInfo` is `getPoolData`, `getActiveWithdrawalNFTs`
  is `getWithdrawals`.
- Removed: `getCurrentApy` and `getHistoricalApy` (use `getRealizedApy`, which
  measures what holders received), `getHoldersCount`, `getStakersCount`,
  `getAvailableBalance`, `stakeMax`, `unstakeBestRate` (use `unstake`),
  `getRoundTimestamps` (use `getRoundInfo`), `clearStorageData`,
  `clearStorageUserData`.
- Nothing is stored in `localStorage` any more, and the global `JSON` is left
  alone.

## Development

```bash
npm install
npm test          # watch mode; npm run test:run once
npm run check     # Biome lint and format
npm run typecheck
npm run build     # dist/esm, dist/cjs and dist/kton-sdk.global.js
```

Tests replay real TonCenter responses kept in `test/fixtures`. To release, bump
`version` in `package.json`, add the changes to `CHANGELOG.md`, and push a tag
such as `v2.0.1`: the release workflow tests, publishes to npm with
provenance, and creates the GitHub release.

## License

[MIT](LICENSE)
