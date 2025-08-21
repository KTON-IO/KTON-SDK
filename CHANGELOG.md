# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-08-21

### 🎉 Initial Release

The first stable release of KTON SDK - Advanced Staking SDK for TON Blockchain.

### ✨ Added

#### Core Features
- **Complete Staking Operations**
  - Basic staking and unstaking functionality
  - Maximum balance staking (`stakeMax()`)
  - Instant unstaking with higher fees (`unstakeInstant()`)
  - Best rate unstaking optimization (`unstakeBestRate()`)

#### Balance Management
- Real-time TON balance retrieval
- Staked KTON balance tracking
- Available balance calculation
- Multi-currency support

#### Analytics & Metrics
- Current APY (Annual Percentage Yield) calculation
- Historical APY data retrieval
- TVL (Total Value Locked) tracking
- Token holder count statistics
- Market rates and exchange information

#### Wallet Integration
- Seamless TonConnect integration
- Event-driven wallet state management
- Multi-wallet support (Tonkeeper, MyTonWallet, etc.)
- Automatic wallet detection and connection

#### Developer Experience
- **TypeScript First**: Full type safety and IntelliSense support
- **Cross-platform**: Works in browsers, Node.js, and mobile environments
- **Performance Optimized**: Built-in caching system
- **Event-driven Architecture**: Real-time state notifications

### 🏗️ Technical Implementation

#### API Integration
- TonCenter V3 API support
- Jetton Index API integration
- TonAPI fallback mechanism
- Smart API switching and error handling

#### Build System
- Dual build output: ESM and UMD formats
- TypeScript compilation with declaration files
- Source maps for debugging
- Terser minification for production

#### Development Tools
- ESLint for code quality
- Prettier for code formatting
- GitHub Actions CI/CD pipeline
- Automated testing framework

### 📦 Package Details

- **Package Name**: `kton-sdk`
- **Version**: `1.0.0`
- **License**: MIT
- **Node.js**: >= 16.0.0
- **Bundle Sizes**:
  - ESM: 86.17 kB (14.28 kB gzipped)
  - UMD: 33.96 kB (8.53 kB gzipped)

### 🚀 Installation Methods

```bash
# NPM
npm install kton-sdk

# Yarn
yarn add kton-sdk

# CDN
<script src="https://unpkg.com/kton-sdk@1.0.0/dist/kton-sdk.min.js"></script>
```

### 🎯 Key APIs

#### Staking Operations
```typescript
await kton.stake(1.5);           // Stake 1.5 TON
await kton.stakeMax();           // Stake maximum available
await kton.unstake(1);           // Standard unstaking
await kton.unstakeInstant(1);    // Instant unstaking
await kton.unstakeBestRate(1);   // Best rate unstaking
```

#### Information Retrieval
```typescript
const apy = await kton.getCurrentApy();          // Current APY
const tvl = await kton.getTvl();                 // Total Value Locked
const holders = await kton.getHoldersCount();    // Token holders
const rates = await kton.getRates();             // Exchange rates
```

### 🔧 Configuration Options

- `connector`: TonConnect UI instance (required)
- `partnerCode`: Partner identification code
- `tonApiKey`: TonAPI key for enhanced rate limits
- `isTestnet`: Enable testnet mode
- `cacheFor`: Cache duration in milliseconds

### 🎮 Examples & Demos

- **Live Demo**: Interactive web demo included
- **React Integration**: Complete React app example
- **Vanilla JavaScript**: Browser-ready example
- **Node.js**: Server-side implementation

### 📚 Documentation

- Comprehensive README with API reference
- Contributing guidelines
- Code examples and best practices
- Development setup instructions

### 🛡️ Security & Reliability

- Input validation and sanitization
- Error handling with graceful fallbacks
- Network resilience with retry mechanisms
- Security best practices implementation

---

## Development Notes

This release establishes KTON SDK as a production-ready solution for TON blockchain staking integration. The architecture is designed for scalability, maintainability, and developer experience.

### Breaking Changes from Pre-releases
- Complete rewrite from TonStakers-based implementation
- New API endpoints integration
- Enhanced error handling
- Improved TypeScript support

### Migration Guide
This is the initial stable release. For users coming from preview versions, please refer to the updated documentation and examples.

### Future Roadmap
- Enhanced testing coverage
- Additional staking strategies
- Mobile SDK support
- DeFi integration features