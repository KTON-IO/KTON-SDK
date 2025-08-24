# pKTON Support in KTON SDK

KTON SDK now supports both **KTON** and **pKTON** liquid staking tokens with a unified API interface. This guide covers everything you need to know about using pKTON features.

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Contract Addresses](#contract-addresses)
- [Usage Examples](#usage-examples)
- [API Reference](#api-reference)
- [Migration Guide](#migration-guide)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

### What's New in v1.1.0

- **🔄 Dual Protocol Support**: Full KTON and pKTON compatibility
- **🔀 Dynamic Token Switching**: Switch between protocols at runtime
- **🔙 100% Backward Compatible**: All existing code continues to work unchanged
- **🎯 Unified API**: Same interface for both token types

### Key Benefits

- **Single SDK**: No need for separate libraries
- **Consistent Interface**: Same methods work for both protocols
- **Runtime Flexibility**: Switch protocols without reinitialization
- **Type Safety**: Full TypeScript support for both token types

## Quick Start

### Installation

```bash
npm install kton-sdk
```

### Basic Usage

#### Using KTON (Default)

```typescript
import { KTON } from "kton-sdk";

const kton = new KTON({
  connector: tonConnectUI,
  // tokenType defaults to 'KTON' - backward compatible
});

await kton.stake(1); // Stake 1 TON for KTON
```

#### Using pKTON

```typescript
import { KTON } from "kton-sdk";

const pkton = new KTON({
  connector: tonConnectUI,
  tokenType: 'pKTON', // Specify pKTON
});

await pkton.stake(1); // Stake 1 TON for pKTON
```

#### Dynamic Switching

```typescript
const sdk = new KTON({ connector: tonConnectUI });

// Start with KTON
console.log(sdk.getTokenType()); // "KTON"

// Switch to pKTON
await sdk.switchTokenType('pKTON');
console.log(sdk.getTokenType()); // "pKTON"
```

## Contract Addresses

| Protocol | Network | Contract Address |
|----------|---------|------------------|
| **KTON** | Mainnet | `EQA9HwEZD_tONfVz6lJS0PVKR5viEiEGyj9AuQewGQVnXPg0` |
| **KTON** | Testnet | `kQD2y9eUotYw7VprrD0UJvAigDVXwgCCLWAl-DjaamCHniVr` |
| **pKTON** | Mainnet | `EQDsW2P6nuP1zopKoNiCYj2xhqDan0cBuULQ8MH4o7dBt_7a` |
| **pKTON** | Testnet | `kQD2y9eUotYw7VprrD0UJvAigDVXwgCCLWAl-DjaamCHniVr` |

### API Endpoints

Both protocols use the same API endpoints:

| Service | Network | Endpoint |
|---------|---------|----------|
| **TonAPI** | Mainnet | `https://tonapi.io` |
| **TonAPI** | Testnet | `https://testnet.tonapi.io` |
| **TonCenter V3** | Mainnet | `https://toncenter.com/api/v3` |
| **TonCenter V3** | Testnet | `https://testnet.toncenter.com/api/v3` |

## Usage Examples

### 1. Initialize with Specific Token

```typescript
import { KTON, type TokenType } from "kton-sdk";

// KTON instance
const ktonSDK = new KTON({
  connector: tonConnectUI,
  tokenType: 'KTON',
  isTestnet: false
});

// pKTON instance
const pKtonSDK = new KTON({
  connector: tonConnectUI,
  tokenType: 'pKTON',
  isTestnet: false
});

// Both use the same API
await ktonSDK.stake(1);
await pKtonSDK.stake(1);
```

### 2. Runtime Token Switching

```typescript
const sdk = new KTON({ connector: tonConnectUI });

// Listen for token type changes
sdk.addEventListener("token_type_switched", () => {
  console.log("Switched to:", sdk.getTokenType());
  // Update UI, refresh data, etc.
});

// Switch between protocols
await sdk.switchTokenType('pKTON');
await sdk.switchTokenType('KTON');
```

### 3. Multi-Protocol Application

```typescript
class StakingManager {
  private ktonSDK: KTON;
  private pKtonSDK: KTON;

  constructor(connector: any) {
    this.ktonSDK = new KTON({ connector, tokenType: 'KTON' });
    this.pKtonSDK = new KTON({ connector, tokenType: 'pKTON' });
  }

  async getBalances() {
    const [ktonBalance, pKtonBalance] = await Promise.all([
      this.ktonSDK.getStakedBalance(),
      this.pKtonSDK.getStakedBalance()
    ]);

    return {
      KTON: ktonBalance,
      pKTON: pKtonBalance,
      total: ktonBalance + pKtonBalance
    };
  }

  async getAPYs() {
    const [ktonAPY, pKtonAPY] = await Promise.all([
      this.ktonSDK.getCurrentApy(),
      this.pKtonSDK.getCurrentApy()
    ]);

    return { KTON: ktonAPY, pKTON: pKtonAPY };
  }
}
```

### 4. Browser Integration

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/kton-sdk@latest/dist/kton-sdk.min.js"></script>
  <script src="https://unpkg.com/@tonconnect/ui@latest/dist/tonconnect-ui.min.js"></script>
</head>
<body>
  <select id="tokenType">
    <option value="KTON">KTON</option>
    <option value="pKTON">pKTON</option>
  </select>
  <button id="stake">Stake 1 TON</button>

  <script>
    const { KTON } = window.KTONSDK;
    const sdk = new KTON({
      connector: new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: "your-manifest.json"
      })
    });

    document.getElementById('tokenType').addEventListener('change', async (e) => {
      await sdk.switchTokenType(e.target.value);
    });

    document.getElementById('stake').addEventListener('click', async () => {
      await sdk.stake(1);
    });
  </script>
</body>
</html>
```

## API Reference

### Constructor Options

```typescript
interface KTONOptions {
  connector: IWalletConnector;        // TonConnect UI instance
  tokenType?: 'KTON' | 'pKTON';     // Token protocol (default: 'KTON')
  partnerCode?: number;               // Partner identification code
  tonApiKey?: string;                 // TonAPI key for enhanced rate limits
  isTestnet?: boolean;                // Enable testnet mode (default: false)
  cacheFor?: number;                  // Cache duration in milliseconds
}
```

### New Methods

#### `getTokenType(): TokenType`

Returns the currently active token type.

```typescript
const currentType = sdk.getTokenType(); // 'KTON' | 'pKTON'
```

#### `switchTokenType(newTokenType: TokenType): Promise<void>`

Dynamically switches between KTON and pKTON protocols.

```typescript
await sdk.switchTokenType('pKTON'); // Switch to pKTON
await sdk.switchTokenType('KTON');  // Switch back to KTON
```

**What happens during switching:**
1. Clears previous wallet state
2. Updates contract addresses
3. Re-initializes the SDK with new protocol
4. Emits `token_type_switched` event

### Existing Methods (Work with Both Protocols)

All existing methods work identically for both KTON and pKTON:

```typescript
// Staking operations
await sdk.stake(amount);
await sdk.stakeMax();
await sdk.unstake(amount);
await sdk.unstakeInstant(amount);
await sdk.unstakeBestRate(amount);

// Balance management
await sdk.getBalance();
await sdk.getStakedBalance();
await sdk.getAvailableBalance();

// Analytics
await sdk.getCurrentApy();
await sdk.getTvl();
await sdk.getHoldersCount();
await sdk.getRates();

// Withdrawals
await sdk.getActiveWithdrawalNFTs();
await sdk.getInstantLiquidity();
```

### Event Handling

```typescript
// New event for token type switches
sdk.addEventListener("token_type_switched", () => {
  console.log("Token type changed to:", sdk.getTokenType());
});

// Existing events still work
sdk.addEventListener("initialized", () => {
  console.log("SDK initialized");
});

sdk.addEventListener("wallet_connected", () => {
  console.log("Wallet connected");
});
```

## Migration Guide

### From v1.0.x to v1.1.0

**✅ Zero Breaking Changes**: Your existing code will continue to work exactly as before.

#### Existing Code (Still Works)

```typescript
// This continues to work unchanged
const kton = new KTON({
  connector: tonConnectUI,
  partnerCode: 123456,
  isTestnet: false
});

await kton.stake(1);
const apy = await kton.getCurrentApy();
```

#### Adding pKTON Support

**Option 1: Separate Instances**
```typescript
const ktonSDK = new KTON({ connector, tokenType: 'KTON' });
const pKtonSDK = new KTON({ connector, tokenType: 'pKTON' });
```

**Option 2: Dynamic Switching**
```typescript
const sdk = new KTON({ connector });

// Switch as needed
await sdk.switchTokenType('pKTON');
await sdk.switchTokenType('KTON');
```

**Option 3: Configuration-Based**
```typescript
const tokenType = userPreferences.preferredToken; // 'KTON' | 'pKTON'
const sdk = new KTON({ connector, tokenType });
```

### TypeScript Migration

```typescript
// Update imports to include type
import { KTON, type TokenType } from "kton-sdk";

// Use type-safe token selection
const tokenType: TokenType = 'pKTON';
const sdk = new KTON({ connector, tokenType });
```

## Best Practices

### 1. Use Separate Instances for Different Protocols

If you need to work with both protocols simultaneously:

```typescript
// Recommended for multi-protocol applications
class MultiProtocolStaking {
  private kton = new KTON({ connector, tokenType: 'KTON' });
  private pkton = new KTON({ connector, tokenType: 'pKTON' });

  async getProtocolData(protocol: TokenType) {
    const sdk = protocol === 'KTON' ? this.kton : this.pkton;
    return {
      apy: await sdk.getCurrentApy(),
      tvl: await sdk.getTvl(),
      balance: await sdk.getStakedBalance()
    };
  }
}
```

### 2. Listen to Token Switch Events

Always listen for token type changes to update your UI:

```typescript
sdk.addEventListener("token_type_switched", async () => {
  // Update UI elements
  updateTokenDisplay(sdk.getTokenType());
  
  // Refresh data for new protocol
  await refreshProtocolData();
  
  // Update user preferences
  saveUserPreference('tokenType', sdk.getTokenType());
});
```

### 3. Handle Errors Gracefully

```typescript
async function switchProtocol(newType: TokenType) {
  try {
    await sdk.switchTokenType(newType);
    console.log(`Successfully switched to ${newType}`);
  } catch (error) {
    console.error(`Failed to switch to ${newType}:`, error);
    // Revert UI state or show error message
  }
}
```

### 4. Cache Protocol Data Separately

```typescript
class ProtocolDataCache {
  private cache = new Map<TokenType, any>();

  async getData(protocol: TokenType, sdk: KTON) {
    const cacheKey = protocol;
    
    if (!this.cache.has(cacheKey)) {
      const data = {
        apy: await sdk.getCurrentApy(),
        tvl: await sdk.getTvl(),
        rates: await sdk.getRates()
      };
      this.cache.set(cacheKey, data);
    }
    
    return this.cache.get(cacheKey);
  }
}
```

### 5. Clear Cache After Token Switches

```typescript
sdk.addEventListener("token_type_switched", async () => {
  // Clear user-specific cache for clean state
  await sdk.clearStorageUserData();
  
  // Refresh balances and data
  await refreshData();
});
```

## Troubleshooting

### Common Issues

#### 1. Token Switch Fails

**Problem**: `switchTokenType()` throws an error

**Solutions**:
- Ensure wallet is connected before switching
- Check network connectivity
- Verify the target protocol is supported on current network

```typescript
if (!sdk.ready) {
  console.error("SDK not ready for token switching");
  return;
}

try {
  await sdk.switchTokenType('pKTON');
} catch (error) {
  console.error("Switch failed:", error.message);
}
```

#### 2. Data Inconsistencies After Switch

**Problem**: Data doesn't refresh after token switch

**Solution**: Always refresh data after switching

```typescript
sdk.addEventListener("token_type_switched", async () => {
  // Clear old data
  await sdk.clearStorageUserData();
  
  // Fetch new data
  const apy = await sdk.getCurrentApy();
  const balance = await sdk.getStakedBalance();
});
```

#### 3. UI State Issues

**Problem**: UI doesn't update to reflect new token type

**Solution**: Update UI elements when token type changes

```typescript
function updateUI(tokenType: TokenType) {
  // Update labels
  document.querySelectorAll('.token-label').forEach(el => {
    el.textContent = tokenType;
  });
  
  // Update colors/themes
  document.body.className = `theme-${tokenType.toLowerCase()}`;
  
  // Update form selections
  const selector = document.getElementById('tokenSelect') as HTMLSelectElement;
  selector.value = tokenType;
}

sdk.addEventListener("token_type_switched", () => {
  updateUI(sdk.getTokenType());
});
```

#### 4. Contract Address Issues

**Problem**: Incorrect contract being called

**Solution**: The SDK automatically handles contract selection, but you can verify:

```typescript
// This is handled automatically, but for debugging:
console.log("Current token type:", sdk.getTokenType());
console.log("Current network:", sdk.isTestnet ? "testnet" : "mainnet");

// The SDK will use the correct contract address based on these values
```

### Debugging Tips

#### 1. Enable Debug Logging

```typescript
// Check SDK state
console.log("SDK ready:", sdk.ready);
console.log("Token type:", sdk.getTokenType());
console.log("Is testnet:", sdk.isTestnet);
```

#### 2. Monitor Events

```typescript
// Listen to all SDK events for debugging
['initialized', 'deinitialized', 'wallet_connected', 'wallet_disconnected', 'token_type_switched']
  .forEach(event => {
    sdk.addEventListener(event, () => {
      console.log(`Event: ${event}`, {
        ready: sdk.ready,
        tokenType: sdk.getTokenType()
      });
    });
  });
```

#### 3. Validate State Before Operations

```typescript
async function safeStake(amount: number) {
  // Validate state before operations
  if (!sdk.ready) {
    throw new Error("SDK not initialized");
  }
  
  console.log(`Staking ${amount} TON for ${sdk.getTokenType()}`);
  return await sdk.stake(amount);
}
```

### Getting Help

If you encounter issues:

1. **Check the Console**: Look for error messages and warnings
2. **Verify Network**: Ensure you're on the correct network (mainnet/testnet)
3. **Update SDK**: Make sure you're using the latest version
4. **Open an Issue**: Report bugs at [GitHub Issues](https://github.com/KTON-IO/KTON-SDK/issues)

### Performance Considerations

- **Instance Management**: Use separate instances for simultaneous multi-protocol operations
- **Event Listeners**: Remove unused event listeners to prevent memory leaks
- **Cache Strategy**: Clear caches appropriately after token switches
- **Network Requests**: Be mindful of API rate limits when switching frequently

---

For more examples and detailed documentation, see the main [README.md](../README.md) file.