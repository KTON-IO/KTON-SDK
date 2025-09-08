# 🚀 KTON SDK

<p align="center">
  <img src="https://kton.io/logo.svg" width="200" alt="KTON Logo">
</p>

<p align="center">
  <strong>Advanced Liquid Staking SDK for TON Blockchain</strong><br>
  <em>Supporting both KTON and pKTON protocols</em>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/kton-sdk">
    <img src="https://img.shields.io/npm/v/kton-sdk?color=blue&style=flat-square" alt="npm version">
  </a>
  <a href="https://www.npmjs.com/package/kton-sdk">
    <img src="https://img.shields.io/npm/dt/kton-sdk?color=green&style=flat-square" alt="npm downloads">
  </a>
  <a href="https://github.com/KTON-IO/KTON-SDK/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/KTON-IO/KTON-SDK?color=orange&style=flat-square" alt="license">
  </a>
  <a href="https://github.com/KTON-IO/KTON-SDK/actions">
    <img src="https://img.shields.io/github/workflow/status/KTON-IO/KTON-SDK/CI?style=flat-square" alt="build status">
  </a>
</p>

---

## 📖 Overview

KTON SDK is a comprehensive TypeScript/JavaScript library for seamless integration with TON blockchain's liquid staking ecosystem. **Now supporting both KTON and pKTON protocols** with a unified API interface, making it easy to build applications that work with multiple staking protocols.

### 🆕 What's New in v1.1.2

- **🔄 Dual Protocol Support**: Full KTON and pKTON compatibility
- **🔀 Dynamic Token Switching**: Switch between protocols at runtime  
- **🔙 100% Backward Compatible**: Existing code works unchanged
- **🎯 Unified API**: Same interface for both token types

### ✨ Key Features

- 🔄 **Dual Protocol Support** - KTON and pKTON liquid staking protocols
- 📊 **Real-time Analytics** - APY, TVL, and detailed staking metrics  
- 💰 **Multi-Strategy Support** - Standard, instant, and best-rate unstaking
- 🔀 **Dynamic Token Switching** - Switch between KTON/pKTON at runtime
- 🔗 **Wallet Integration** - Seamless TonConnect integration
- 📱 **Cross-platform** - Browser, Node.js, and mobile environments
- 🏗️ **TypeScript First** - Full type safety and IntelliSense support
- ⚡ **Performance Optimized** - Built-in caching and efficient API usage

## 🚀 Quick Start

### Installation

```bash
# Using npm
npm install kton-sdk

# Using yarn
yarn add kton-sdk

# Using pnpm
pnpm add kton-sdk
```

### Basic Usage

#### KTON (Default - Backward Compatible)

```typescript
import { KTON } from "kton-sdk";
import { TonConnectUI } from "@tonconnect/ui";

const tonConnectUI = new TonConnectUI({
  manifestUrl: "https://yourapp.com/tonconnect-manifest.json",
});

// Initialize with KTON (default behavior)
const kton = new KTON({
  connector: tonConnectUI,
  isTestnet: false,
});

// All your existing code works unchanged!
await kton.stake(1); // Stake 1 TON
const apy = await kton.getCurrentApy();
const balance = await kton.getStakedBalance();
```

#### pKTON Support

```typescript
// Initialize with pKTON
const pkton = new KTON({
  connector: tonConnectUI,
  tokenType: 'pKTON', // Specify pKTON
  isTestnet: false,
});

// Same API, different protocol
await pkton.stake(1);
const apy = await pkton.getCurrentApy();
const balance = await pkton.getStakedBalance();
```

#### Dynamic Token Switching

```typescript
import { KTON, type TokenType } from "kton-sdk";

const sdk = new KTON({ connector: tonConnectUI });

// Check current token type
console.log(sdk.getTokenType()); // "KTON"

// Switch to pKTON
await sdk.switchTokenType('pKTON');
console.log(sdk.getTokenType()); // "pKTON"

// Listen for switches
sdk.addEventListener("token_type_switched", () => {
  console.log("Now using:", sdk.getTokenType());
});
```

### Browser Integration

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/kton-sdk@latest/dist/kton-sdk.min.js"></script>
  <script src="https://unpkg.com/@tonconnect/ui@latest/dist/tonconnect-ui.min.js"></script>
</head>
<body>
  <script>
    const { KTON } = window.KTONSDK;
    
    // KTON usage
    const kton = new KTON({
      connector: new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: "https://yourapp.com/tonconnect-manifest.json"
      })
    });
    
    // pKTON usage
    const pkton = new KTON({
      connector: new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: "https://yourapp.com/tonconnect-manifest.json"
      }),
      tokenType: 'pKTON'
    });
  </script>
</body>
</html>
```

## 📚 API Reference

### Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `connector` | `IWalletConnector` | Required | TonConnect UI instance |
| `tokenType` | `'KTON' \| 'pKTON'` | `'KTON'` | **NEW**: Token protocol type |
| `partnerCode` | `number` | `0x0000000074746f6e` | Partner identification code |
| `tonApiKey` | `string` | `undefined` | TonAPI key for enhanced rate limits |
| `isTestnet` | `boolean` | `false` | Enable testnet mode |
| `cacheFor` | `number` | `30000` | Cache duration in milliseconds |

### Core Methods

#### Staking Operations

```typescript
// Basic staking (works with both KTON and pKTON)
await sdk.stake(1.5); // Stake 1.5 TON

// Stake maximum available balance
await sdk.stakeMax();

// Unstaking options
await sdk.unstake(1); // Standard unstaking
await sdk.unstakeInstant(1); // Instant unstaking (higher fees)
await sdk.unstakeBestRate(1); // Best rate unstaking
```

#### Balance Management

```typescript
// Get various balances
const tonBalance = await sdk.getBalance(); // TON balance
const stakedBalance = await sdk.getStakedBalance(); // Staked token balance
const availableBalance = await sdk.getAvailableBalance(); // Available for staking
```

#### Analytics & Information

```typescript
// Staking metrics
const currentApy = await sdk.getCurrentApy(); // Current APY
const historicalApy = await sdk.getHistoricalApy(); // APY history
const tvl = await sdk.getTvl(); // Total Value Locked
const holdersCount = await sdk.getHoldersCount(); // Token holders count

// Market data
const rates = await sdk.getRates();
console.log(`1 TON = ${rates.TONUSD} USD`);
console.log(`1 ${sdk.getTokenType()} = ${rates.KTONTON} TON`);

// Validation rounds
const { roundStart, roundEnd } = await sdk.getRoundTimestamps();

// Withdrawal tracking
const activeWithdrawals = await sdk.getActiveWithdrawalNFTs();
const instantLiquidity = await sdk.getInstantLiquidity();
```

#### Token Type Management

```typescript
// Get current token type
const currentType = sdk.getTokenType(); // 'KTON' | 'pKTON'

// Switch token type
await sdk.switchTokenType('pKTON'); // Switch to pKTON
await sdk.switchTokenType('KTON');  // Switch to KTON
```

#### Event Handling

```typescript
// Listen for SDK events
sdk.addEventListener("initialized", () => {
  console.log("SDK ready!");
});

sdk.addEventListener("token_type_switched", () => {
  console.log("Token type changed to:", sdk.getTokenType());
});

sdk.addEventListener("wallet_connected", () => {
  console.log("Wallet connected");
});

sdk.addEventListener("wallet_disconnected", () => {
  console.log("Wallet disconnected");
});
```

#### Cache Management

```typescript
// Clear cached data
await sdk.clearStorageData(); // Clear all cache
await sdk.clearStorageUserData(); // Clear user-specific cache
```

## 🔗 Protocol Support

### Contract Addresses

| Protocol | Network | Contract Address |
|----------|---------|------------------|
| **KTON** | Mainnet | `EQA9HwEZD_tONfVz6lJS0PVKR5viEiEGyj9AuQewGQVnXPg0` |
| **KTON** | Testnet | `kQD2y9eUotYw7VprrD0UJvAigDVXwgCCLWAl-DjaamCHniVr` |
| **pKTON** | Mainnet | `EQDsW2P6nuP1zopKoNiCYj2xhqDan0cBuULQ8MH4o7dBt_7a` |
| **pKTON** | Testnet | `kQD2y9eUotYw7VprrD0UJvAigDVXwgCCLWAl-DjaamCHniVr` |

### API Endpoints

| Service | Network | Endpoint |
|---------|---------|----------|
| **TonAPI** | Mainnet | `https://tonapi.io` |
| **TonAPI** | Testnet | `https://testnet.tonapi.io` |
| **TonCenter V3** | Mainnet | `https://toncenter.com/api/v3` |
| **TonCenter V3** | Testnet | `https://testnet.toncenter.com/api/v3` |

## 🎮 Demo & Examples

### Live Demo

Try the interactive demo to see both KTON and pKTON in action:

```bash
# Clone the repository
git clone https://github.com/KTON-IO/KTON-SDK.git
cd KTON-SDK

# Install dependencies
npm install

# Build the SDK
npm run build

# Start demo server
npm run docs
```

Visit `http://localhost:8000/demo` in your browser.

**Demo Features:**
- 🔗 Connect TON wallet (Tonkeeper, MyTonWallet, etc.)
- 🔀 Switch between KTON and pKTON protocols
- 💰 View balances and staking statistics
- 📈 Real-time APY and TVL data
- 🔄 Stake/unstake operations
- 📊 Withdrawal tracking

### Example Projects

Check out these example implementations:

- **[React Integration](./examples/react)** - Complete React app with both KTON and pKTON
- **[Vue.js Example](./examples/vue)** - Vue.js application with token switching
- **[Vanilla JavaScript](./examples/vanilla)** - Pure JavaScript implementation
- **[Node.js Server](./examples/node)** - Server-side usage
- **[Token Switching Demo](./examples/token-switching.js)** - Dynamic protocol switching

## 🔄 Migration Guide

### From v1.0.x to v1.1.2

**✅ Zero Breaking Changes**: Your existing code will continue to work exactly as before.

#### Existing Code (Still Works)
```typescript
// This continues to work unchanged
const kton = new KTON({
  connector: tonConnectUI,
  isTestnet: false
});
```

#### Adding pKTON Support
```typescript
// Option 1: Use separate instances
const ktonSDK = new KTON({ connector, tokenType: 'KTON' });
const pKtonSDK = new KTON({ connector, tokenType: 'pKTON' });

// Option 2: Use dynamic switching
const sdk = new KTON({ connector });
await sdk.switchTokenType('pKTON'); // Switch to pKTON
await sdk.switchTokenType('KTON');  // Switch back
```

### TypeScript Support

```typescript
import { KTON, type TokenType } from "kton-sdk";

const tokenType: TokenType = 'pKTON'; // Type-safe token selection

// Full TypeScript IntelliSense support
const sdk = new KTON({
  connector: tonConnectUI,
  tokenType, // Fully typed
  isTestnet: false
});
```

## 🛠️ Development

### Prerequisites

- Node.js 16+ 
- npm, yarn, or pnpm
- A TON wallet for testing

### Building from Source

```bash
# Clone repository
git clone https://github.com/KTON-IO/KTON-SDK.git
cd KTON-SDK

# Install dependencies
npm install

# Build the SDK
npm run build

# Run in development mode (with watch)
npm run dev
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Build production bundle |
| `npm run dev` | Development mode with file watching |
| `npm run clean` | Clean build artifacts |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run lint` | Lint code with ESLint |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run test suite |
| `npm run docs` | Start documentation server |

## 🚀 Deployment

### Publishing to NPM

```bash
# Build and publish
npm run build
npm publish
```

### CDN Usage

```html
<!-- Latest version -->
<script src="https://unpkg.com/kton-sdk@latest/dist/kton-sdk.min.js"></script>

<!-- Specific version -->
<script src="https://unpkg.com/kton-sdk@1.1.2/dist/kton-sdk.min.js"></script>
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm run test`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📚 **Documentation**: [pKTON Support Guide](./docs/pKTON-support.md)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/KTON-IO/KTON-SDK/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/KTON-IO/KTON-SDK/discussions)
- 🔗 **TON Community**: [TON Developers Chat](https://t.me/tondev_eng)

## 🏗️ Built With

- [TypeScript](https://www.typescriptlang.org/) - Programming language
- [Vite](https://vitejs.dev/) - Build tool
- [TON SDK](https://github.com/ton-org) - TON blockchain integration
- [TonConnect](https://docs.ton.org/develop/dapps/ton-connect) - Wallet connectivity

## 📊 Bundle Size

- **ESM**: 680.36 kB (129.47 kB gzipped)
- **UMD**: 339.48 kB (99.76 kB gzipped)
- **TypeScript Declarations**: Full type support included

---

<p align="center">
  Made with ❤️ by the KTON Team
</p>