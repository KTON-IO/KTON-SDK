import type { TonConnect } from "@tonconnect/sdk";
import { expectTypeOf, it } from "vitest";
import type { TonConnectLike } from "../src/kton.js";

it("takes a TonConnect instance as its connector", () => {
  expectTypeOf<TonConnect>().toExtend<TonConnectLike>();
});
