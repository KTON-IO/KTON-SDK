import { describe, expect, it } from "vitest";
import { parseRoundLog, realizedApy } from "../src/apy.js";
import { fixture } from "./helpers.js";

interface Message {
  destination: string | null;
  created_at: string;
  message_content: { body: string };
}

const { messages } = fixture<{ messages: Message[] }>("pool-messages");
const logs = messages.filter((m) => m.destination === null);
const points = logs.flatMap((m) => {
  const point = parseRoundLog(m.message_content.body, Number(m.created_at));
  return point ? [point] : [];
});

describe("parseRoundLog", () => {
  it("reads one round-completion log per round and nothing else", () => {
    // The pool logs loans, repayments and rotations too; only the round
    // completions parse.
    expect(logs.length).toBeGreaterThan(points.length);
    expect(points.length).toBeGreaterThan(10);
    const rounds = points.map((p) => p.roundId);
    expect(new Set(rounds).size).toBe(rounds.length);
    for (const p of points) {
      const price = Number(p.totalBalance) / Number(p.supply);
      expect(price).toBeGreaterThan(1);
      expect(price).toBeLessThan(1.5);
    }
  });

  it("returns null for a body that is not a log", () => {
    expect(parseRoundLog("te6cckEBAQEAAgAAAEysuc0=", 0)).toBeNull();
    expect(parseRoundLog("not base64", 0)).toBeNull();
  });
});

describe("realizedApy", () => {
  it("measures the share price over rounds of the same parity", () => {
    const result = realizedApy(points, 20);
    expect(result).not.toBeNull();
    if (!result) return;
    expect((result.toRound - result.fromRound) % 2).toBe(0);
    expect(result.days).toBeGreaterThan(15);
    expect(result.days).toBeLessThanOrEqual(20);
    // About 13.4% a year after the 16% fee in September 2026.
    expect(result.apy).toBeGreaterThan(0.1);
    expect(result.apy).toBeLessThan(0.17);
  });

  it("needs two comparable rounds", () => {
    expect(realizedApy([], 30)).toBeNull();
    expect(realizedApy(points.slice(0, 1), 30)).toBeNull();
  });
});
