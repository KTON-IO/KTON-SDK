# 🚀 KTON SDK

<p align="center">
  <img src="https://kton.io/logo.svg" width="200" alt="KTON Logo">
</p>

<p align="center">
  <strong>Advanced Staking SDK for TON Blockchain</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/kton-sdk">
    <img src="https://img.shields.io/npm/v/kton-sdk?color=blue&style=flat-square" alt="npm version">
  </a>
  <a href="https://www.npmjs.com/package/kton-sdk">
    <img src="https://img.shields.io/npm/dt/kton-sdk?color=green&style=flat-square" alt="npm downloads">
  </a>
  <a href="https://github.com/rainboltz/kton-sdk/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/rainboltz/kton-sdk?color=orange&style=flat-square" alt="license">
  </a>
  <a href="https://github.com/rainboltz/kton-sdk/actions">
    <img src="https://img.shields.io/github/workflow/status/rainboltz/kton-sdk/CI?style=flat-square" alt="build status">
  </a>
</p>

---

## 📖 Overview

KTON SDK is a comprehensive TypeScript/JavaScript library designed for seamless integration with the TON blockchain's staking ecosystem. Built for developers who want to incorporate advanced staking functionalities into their decentralized applications, KTON SDK provides intuitive APIs for staking operations, balance management, yield optimization, and much more.

### ✨ Key Features

- 🔄 **Complete Staking Operations** - Stake, unstake, and manage liquid staking positions
- 📊 **Real-time Analytics** - Access APY, TVL, and detailed staking metrics  
- 💰 **Multi-Strategy Support** - Standard, instant, and best-rate unstaking options
- 🔗 **Wallet Integration** - Seamless TonConnect integration
- 📱 **Cross-platform** - Works in browsers, Node.js, and mobile environments
- 🏗️ **TypeScript First** - Full type safety and IntelliSense support
- ⚡ **Performance Optimized** - Built-in caching and efficient API usage

## 🚀 Quick Start

### Installation

Install KTON SDK using your preferred package manager:

```bash
# Using npm
npm install kton-sdk

# Using yarn
yarn add kton-sdk

# Using pnpm
pnpm add kton-sdk
```

### Basic Usage

```typescript
import { KTON } from "kton-sdk";
import { TonConnectUI } from "@tonconnect/ui";

// Initialize TonConnect
const tonConnectUI = new TonConnectUI({
  manifestUrl: "https://yourapp.com/tonconnect-manifest.json",
});

// Initialize KTON SDK
const kton = new KTON({
  connector: tonConnectUI,
  partnerCode: 123456, // Optional: Your partner code
  tonApiKey: "YOUR_API_KEY", // Optional: TonAPI key for higher limits
  isTestnet: false, // Set to true for testnet
});

// Start staking!
await kton.stake(1); // Stake 1 TON
const apy = await kton.getCurrentApy(); // Get current APY
const balance = await kton.getStakedBalance(); // Check staked balance
```

### Browser Integration

For direct HTML integration without bundlers:

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
    
    const kton = new KTON({
      connector: new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: "https://yourapp.com/tonconnect-manifest.json"
      })
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
| `partnerCode` | `number` | `0x0000000074746f6e` | Partner identification code |
| `tonApiKey` | `string` | `undefined` | TonAPI key for enhanced rate limits |
| `isTestnet` | `boolean` | `false` | Enable testnet mode |
| `cacheFor` | `number` | `30000` | Cache duration in milliseconds |

### Core Methods

#### Staking Operations

```typescript
// Basic staking
await kton.stake(1.5); // Stake 1.5 TON

// Stake maximum available balance
await kton.stakeMax();

// Unstaking options
await kton.unstake(1); // Standard unstaking
await kton.unstakeInstant(1); // Instant unstaking (higher fees)
await kton.unstakeBestRate(1); // Best rate unstaking
```

#### Balance Management

```typescript
// Get various balances
const tonBalance = await kton.getBalance(); // TON balance
const stakedBalance = await kton.getStakedBalance(); // Staked KTON balance
const availableBalance = await kton.getAvailableBalance(); // Available for staking
```

#### Analytics & Information

```typescript
// Staking metrics
const currentApy = await kton.getCurrentApy(); // Current APY
const historicalApy = await kton.getHistoricalApy(); // APY history
const tvl = await kton.getTvl(); // Total Value Locked
const holdersCount = await kton.getHoldersCount(); // Token holders count

// Market data
const rates = await kton.getRates();
console.log(`1 TON = ${rates.TONUSD} USD`);
console.log(`1 KTON = ${rates.KTONTON} TON`);

// Validation rounds
const { roundStart, roundEnd } = await kton.getRoundTimestamps();

// Withdrawal tracking
const activeWithdrawals = await kton.getActiveWithdrawalNFTs();
const instantLiquidity = await kton.getInstantLiquidity();
```

#### Event Handling

```typescript
// Listen for SDK events
kton.addEventListener("initialized", () => {
  console.log("KTON SDK ready!");
});

kton.addEventListener("deinitialized", () => {
  console.log("KTON SDK disconnected");
});

kton.addEventListener("wallet_connected", () => {
  console.log("Wallet connected");
});

kton.addEventListener("wallet_disconnected", () => {
  console.log("Wallet disconnected");
});
```

#### Cache Management

```typescript
// Clear cached data
await kton.clearStorageData(); // Clear all cache
await kton.clearStorageUserData(); // Clear user-specific cache
```

## 🎮 Demo & Examples

### Live Demo

Try the interactive demo to see KTON SDK in action:

```bash
# Clone the repository
git clone https://github.com/rainboltz/kton-sdk.git
cd kton-sdk

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
- 💰 View balances and staking statistics
- 📈 Real-time APY and TVL data
- 🔄 Stake/unstake operations
- 📊 Withdrawal tracking

### Example Projects

Check out these example implementations:

- **[React Integration](./examples/react)** - Complete React app with KTON SDK
- **[Vue.js Example](./examples/vue)** - Vue.js application
- **[Vanilla JavaScript](./examples/vanilla)** - Pure JavaScript implementation
- **[Node.js Server](./examples/node)** - Server-side usage

## 🛠️ Development

### Prerequisites

- Node.js 16+ 
- npm, yarn, or pnpm
- A TON wallet for testing

### Building from Source

```bash
# Clone repository
git clone https://github.com/rainboltz/kton-sdk.git
cd kton-sdk

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
<script src="https://unpkg.com/kton-sdk@1.0.0/dist/kton-sdk.min.js"></script>
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

- 📚 **Documentation**: [GitHub Pages](https://rainboltz.github.io/kton-sdk)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/rainboltz/kton-sdk/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/rainboltz/kton-sdk/discussions)
- 🔗 **TON Community**: [TON Developers Chat](https://t.me/tondev_eng)

## 🏗️ Built With

- [TypeScript](https://www.typescriptlang.org/) - Programming language
- [Vite](https://vitejs.dev/) - Build tool
- [TON SDK](https://github.com/ton-org) - TON blockchain integration
- [TonConnect](https://docs.ton.org/develop/dapps/ton-connect) - Wallet connectivity

---

<p align="center">
  Made with ❤️ by the KTON Team
</p>
