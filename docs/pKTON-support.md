# pKTON Support in KTON SDK

The KTON SDK now supports both KTON and pKTON liquid staking tokens with the same unified API interface.

## Overview

All operations remain identical between KTON and pKTON - the SDK automatically handles the different contract addresses based on your token selection.

## Contract Addresses

| Token | Network | Contract Address |
|-------|---------|------------------|
| **KTON** | Mainnet | `EQA9HwEZD_tONfVz6lJS0PVKR5viEiEGyj9AuQewGQVnXPg0` |
| **KTON** | Testnet | `kQD2y9eUotYw7VprrD0UJvAigDVXwgCCLWAl-DjaamCHniVr` |
| **pKTON** | Mainnet | `EQDsW2P6nuP1zopKoNiCYj2xhqDan0cBuULQ8MH4o7dBt_7a` |
| **pKTON** | Testnet | `kQD2y9eUotYw7VprrD0UJvAigDVXwgCCLWAl-DjaamCHniVr` |

## Usage Examples

### 1. Initialize with KTON (Default - Backward Compatible)

```typescript
import { KTON } from "kton-sdk";

const kton = new KTON({
  connector: tonConnectUI,
  // tokenType defaults to 'KTON'
  isTestnet: false
});

// All existing code works exactly as before
await kton.stake(1);
const apy = await kton.getCurrentApy();
```

### 2. Initialize with pKTON

```typescript
import { KTON } from "kton-sdk";

const pkton = new KTON({
  connector: tonConnectUI,
  tokenType: 'pKTON', // Specify pKTON
  isTestnet: false
});

// Same API, different underlying contracts
await pkton.stake(1);
const apy = await pkton.getCurrentApy();
```

### 3. Dynamic Token Switching

```typescript
import { KTON } from "kton-sdk";

const sdk = new KTON({
  connector: tonConnectUI,
  isTestnet: false
});

// Start with KTON
console.log(sdk.getTokenType()); // "KTON"

// Switch to pKTON
await sdk.switchTokenType('pKTON');
console.log(sdk.getTokenType()); // "pKTON"

// Switch back to KTON
await sdk.switchTokenType('KTON');
console.log(sdk.getTokenType()); // "KTON"
```

### 4. Event Handling

```typescript
// Listen for token type switches
sdk.addEventListener("token_type_switched", () => {
  console.log("Switched to:", sdk.getTokenType());
  // Re-fetch balances, APY, etc.
});
```

## New Constructor Options

```typescript
interface KTONOptions {
  connector: IWalletConnector;
  partnerCode?: number;
  tonApiKey?: string;
  cacheFor?: number;
  isTestnet?: boolean;
  tokenType?: 'KTON' | 'pKTON'; // New option
}
```

## New Methods

### `getTokenType(): TokenType`
Returns the current token type (`'KTON'` or `'pKTON'`).

### `switchTokenType(newTokenType: TokenType): Promise<void>`
Dynamically switches between KTON and pKTON. This method:
- Clears wallet state
- Updates contract addresses
- Re-initializes the SDK
- Emits `token_type_switched` event

## New Events

- `token_type_switched`: Fired when `switchTokenType()` completes successfully

## Backward Compatibility

All existing code continues to work without any changes. The `tokenType` parameter defaults to `'KTON'`, maintaining full backward compatibility.

## TypeScript Support

```typescript
import { KTON, type TokenType } from "kton-sdk";

const tokenType: TokenType = 'pKTON'; // Type-safe token selection
```

## Best Practices

1. **Use separate SDK instances** for different tokens if you need to work with both simultaneously
2. **Listen to events** when switching token types to update your UI accordingly  
3. **Clear cached data** after switching token types if needed using `clearStorageData()`
4. **Handle errors** when switching token types, as re-initialization may fail

## Migration Guide

### From Existing Code
No changes needed - your existing code will continue to work exactly as before.

### To Support Both Tokens
```typescript
// Before (KTON only)
const sdk = new KTON({ connector });

// After (with pKTON support)
const ktonSDK = new KTON({ connector, tokenType: 'KTON' });
const pKtonSDK = new KTON({ connector, tokenType: 'pKTON' });

// Or use dynamic switching
const sdk = new KTON({ connector });
await sdk.switchTokenType('pKTON'); // Switch as needed
```