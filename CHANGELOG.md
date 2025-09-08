# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.2] - 2025-09-08

### 🔧 Maintenance Release

#### Enhanced
- Project maintenance and stability improvements
- Documentation consistency updates
- Development workflow optimizations

---

## [1.1.0] - 2025-08-25

### 🚀 Major Features

#### **pKTON LST Support Added**
- **Dual Protocol Support**: SDK now supports both KTON and pKTON liquid staking tokens
- **Unified API**: Same interface for both token types - no code changes needed for existing implementations
- **Dynamic Token Switching**: Switch between KTON and pKTON at runtime with `switchTokenType()`
- **Backward Compatibility**: All existing code continues to work unchanged

### ✨ Added

#### New Constructor Options
- `tokenType?: 'KTON' | 'pKTON'` - Select token type (defaults to 'KTON')

#### New Methods
- `getTokenType(): TokenType` - Get current active token type
- `switchTokenType(newTokenType: TokenType): Promise<void>` - Dynamically switch token types

#### New Events
- `token_type_switched` - Emitted when token type is successfully changed

#### Contract Address Support
- **KTON Mainnet**: `EQA9HwEZD_tONfVz6lJS0PVKR5viEiEGyj9AuQewGQVnXPg0`
- **pKTON Mainnet**: `EQDsW2P6nuP1zopKoNiCYj2xhqDan0cBuULQ8MH4o7dBt_7a`
- **Both Testnet**: `kQD2y9eUotYw7VprrD0UJvAigDVXwgCCLWAl-DjaamCHniVr`

### 🔧 Enhanced

#### API Improvements
- **TonCenter V3 Testnet Support**: Added dedicated testnet endpoint `https://testnet.toncenter.com/api/v3`
- **Smart Address Selection**: Automatic contract address selection based on token type and network
- **Enhanced Logging**: Token type information included in debug logs

#### Demo Enhancements
- **Interactive Token Switching**: Radio buttons to switch between KTON and pKTON
- **Dynamic UI Updates**: Button text and labels update based on selected token type
- **Real-time Data Refresh**: Automatic data reload when switching token types
- **Error Handling**: Graceful fallback if token switching fails

### 📚 Documentation

#### New Documentation Files
- **pKTON Support Guide**: Comprehensive guide for using pKTON features (`docs/pKTON-support.md`)
- **Migration Examples**: Code examples showing how to use both tokens
- **Best Practices**: Recommendations for multi-token implementations

#### Updated Files
- **README.md**: Updated with pKTON usage examples and new features
- **Demo**: Enhanced with token switching capabilities

### 🎯 Usage Examples

#### Initialize with Specific Token
```typescript
// KTON (default - backward compatible)
const kton = new KTON({ connector });

// pKTON
const pkton = new KTON({ connector, tokenType: 'pKTON' });
```

#### Dynamic Token Switching
```typescript
const sdk = new KTON({ connector });

// Switch to pKTON
await sdk.switchTokenType('pKTON');

// Switch back to KTON
await sdk.switchTokenType('KTON');
```

#### Event Handling
```typescript
sdk.addEventListener("token_type_switched", () => {
  console.log("Now using:", sdk.getTokenType());
});
```

### 🔄 Migration Guide

#### For Existing Users
**No changes required!** Your existing code will continue to work exactly as before. The `tokenType` parameter defaults to `'KTON'`.

#### To Add pKTON Support
```typescript
// Before (KTON only)
const sdk = new KTON({ connector });

// After (with pKTON support options)
const ktonSDK = new KTON({ connector, tokenType: 'KTON' });
const pKtonSDK = new KTON({ connector, tokenType: 'pKTON' });

// Or use dynamic switching
await sdk.switchTokenType('pKTON');
```

### 🛡️ Reliability Improvements

- **Type Safety**: Full TypeScript support for new token types
- **Error Handling**: Comprehensive error handling for token switching
- **State Management**: Proper cleanup and re-initialization when switching tokens
- **Network Consistency**: Ensures token type and network compatibility

### 📦 Bundle Information

- **ESM**: 680.36 kB (129.47 kB gzipped)
- **UMD**: 339.48 kB (99.76 kB gzipped)
- **TypeScript Declarations**: Full type support included

---

## [1.0.8] - 2025-08-24

### 🔧 Maintenance Release

#### Fixed
- Build configuration improvements
- Documentation updates
- Development workflow enhancements

---

## [1.0.7] - 2025-08-23

### 📚 Documentation Updates

#### Fixed
- Updated GitHub organization URLs in all documentation
- Corrected repository links and references
- Fixed example code repository paths

---

## [1.0.6] - 2025-08-23

### 🔧 Build System

#### Fixed
- Changelog generation in release workflow
- Release automation improvements

---

## [1.0.5] - 2025-08-22

### 🔧 Minor Improvements

#### Enhanced
- Internal optimizations
- Development tooling updates

---

## [1.0.0] - 2025-08-21

### 🎉 Initial Release

The first stable release of KTON SDK - Advanced Staking SDK for TON Blockchain.

#### Core Features
- **Complete Staking Operations**: Basic, maximum, instant, and best-rate unstaking
- **Balance Management**: Real-time balance tracking and calculations
- **Analytics & Metrics**: APY, TVL, holder statistics, and market rates
- **Wallet Integration**: Seamless TonConnect support
- **Developer Experience**: TypeScript-first with full type safety

#### Technical Implementation
- **Cross-platform**: Browser, Node.js, and mobile support
- **Performance Optimized**: Built-in intelligent caching
- **Event-driven Architecture**: Real-time state notifications
- **Dual Build**: ESM and UMD formats with TypeScript declarations

#### Package Details
- **License**: MIT
- **Node.js**: >= 16.0.0
- **Bundle Sizes**: Optimized for production use

For detailed API documentation and examples, see the README.md and documentation files.

---

## Future Roadmap

### Planned Features
- **Multi-Protocol Support**: Additional LST protocols integration
- **Enhanced Analytics**: Advanced yield optimization strategies  
- **Mobile SDK**: Native mobile app integration
- **DeFi Integration**: Cross-protocol yield farming features
- **Governance Support**: On-chain voting and proposal features

### Development Priorities
1. Enhanced testing coverage
2. Performance optimizations  
3. Additional deployment networks
4. Developer tooling improvements