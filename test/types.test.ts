import type { TonConnect } from "@tonconnect/sdk";
import type { TonConnectUI } from "@tonconnect/ui";
import { expectTypeOf, it } from "vitest";
import type { TonConnectLike } from "../src/kton.js";

it("takes TonConnectUI or TonConnect as its connector", () => {
  expectTypeOf<TonConnectUI>().toExtend<TonConnectLike>();
  expectTypeOf<TonConnect>().toExtend<TonConnectLike>();
});
