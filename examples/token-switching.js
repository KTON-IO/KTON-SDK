// Example demonstrating how to use KTON SDK with both KTON and pKTON
// This is a demonstration file showing the new token switching functionality

import { KTON } from "../dist/kton-sdk.js";

// Mock connector for demonstration (replace with actual TonConnect)
const mockConnector = {
  wallet: { account: { address: "EQA9HwEZD_tONfVz6lJS0PVKR5viEiEGyj9AuQewGQVnXPg0" } },
  sendTransaction: async (details) => ({ boc: "mock_boc" }),
  onStatusChange: (callback) => {}
};

// Example 1: Initialize with KTON (default behavior - backward compatible)
console.log("=== KTON Usage ===");
const ktonSDK = new KTON({
  connector: mockConnector,
  isTestnet: false
});

console.log("Current token type:", ktonSDK.getTokenType()); // "KTON"

// Example 2: Initialize with pKTON
console.log("\n=== pKTON Usage ===");
const pKtonSDK = new KTON({
  connector: mockConnector,
  tokenType: 'pKTON',
  isTestnet: false
});

console.log("Current token type:", pKtonSDK.getTokenType()); // "pKTON"

// Example 3: Dynamic token switching
console.log("\n=== Token Switching ===");
const dynamicSDK = new KTON({
  connector: mockConnector,
  isTestnet: false
});

console.log("Initial token type:", dynamicSDK.getTokenType()); // "KTON"

// Switch to pKTON
await dynamicSDK.switchTokenType('pKTON');
console.log("After switch:", dynamicSDK.getTokenType()); // "pKTON"

// Switch back to KTON
await dynamicSDK.switchTokenType('KTON');
console.log("After switch back:", dynamicSDK.getTokenType()); // "KTON"

// Example 4: Event listening
dynamicSDK.addEventListener("token_type_switched", () => {
  console.log("Token type switched to:", dynamicSDK.getTokenType());
});

console.log("\n✅ All examples completed!");