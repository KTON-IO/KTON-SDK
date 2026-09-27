/** A value on a TonCenter v3 get-method stack. */
export type StackEntry =
  | { type: "num"; value: string }
  | { type: "cell" | "slice"; value: string }
  | { type: "list" | "tuple"; value: StackEntry[] };

export interface RunGetMethodResult {
  gas_used: number;
  exit_code: number;
  stack: StackEntry[];
}

export interface TonCenterOptions {
  endpoint: string;
  apiKey?: string;
  /** Requests per second. TonCenter allows 1 without a key, 10 with one. */
  rps?: number;
  fetch?: typeof globalThis.fetch;
}

export class TonCenterError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "TonCenterError";
  }
}

const MAX_RETRIES = 3;

/**
 * A small TonCenter v3 client: requests go out one at a time at the allowed
 * rate, identical requests in flight share one answer, and a 429 is retried
 * after a pause. Answers are cached for as long as the caller asks.
 */
export class TonCenter {
  private readonly endpoint: string;
  private readonly apiKey?: string;
  private readonly interval: number;
  private readonly fetchFn: typeof globalThis.fetch;
  private queue: Promise<unknown> = Promise.resolve();
  private lastSent = 0;
  private readonly inFlight = new Map<string, Promise<unknown>>();
  private readonly cache = new Map<string, { at: number; value: unknown }>();

  constructor(options: TonCenterOptions) {
    this.endpoint = options.endpoint.replace(/\/+$/, "");
    this.apiKey = options.apiKey;
    // Without an explicit rate, stay a little under TonCenter's: it counts
    // on its side of the network.
    this.interval = options.rps
      ? 1000 / options.rps
      : options.apiKey
        ? 110
        : 1100;
    this.fetchFn = options.fetch ?? globalThis.fetch.bind(globalThis);
  }

  get<T>(
    path: string,
    params: Record<string, string | number | undefined> = {},
    ttlMs = 0,
  ): Promise<T> {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) query.append(key, String(value));
    }
    const qs = query.toString();
    const url = `${this.endpoint}/${path}${qs ? `?${qs}` : ""}`;
    return this.request<T>(`GET ${url}`, ttlMs, () => ({ url, init: {} }));
  }

  runGetMethod(
    address: string,
    method: string,
    stack: StackEntry[] = [],
    ttlMs = 0,
  ): Promise<RunGetMethodResult> {
    const body = JSON.stringify({ address, method, stack });
    const url = `${this.endpoint}/runGetMethod`;
    return this.request<RunGetMethodResult>(
      `POST ${url} ${body}`,
      ttlMs,
      () => ({
        url,
        init: {
          method: "POST",
          body,
          headers: { "content-type": "application/json" },
        },
      }),
    );
  }

  /** Forget every cached answer. */
  clearCache(): void {
    this.cache.clear();
  }

  private request<T>(
    key: string,
    ttlMs: number,
    build: () => { url: string; init: RequestInit },
  ): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.at < ttlMs) {
      return Promise.resolve(cached.value as T);
    }
    const pending = this.inFlight.get(key);
    if (pending) return pending as Promise<T>;

    const promise = this.send<T>(build()).then(
      (value) => {
        this.inFlight.delete(key);
        if (ttlMs > 0) this.cache.set(key, { at: Date.now(), value });
        return value;
      },
      (error: unknown) => {
        this.inFlight.delete(key);
        throw error;
      },
    );
    this.inFlight.set(key, promise);
    return promise;
  }

  private async send<T>({
    url,
    init,
  }: {
    url: string;
    init: RequestInit;
  }): Promise<T> {
    const headers = new Headers(init.headers);
    if (this.apiKey) headers.set("X-API-Key", this.apiKey);

    for (let attempt = 0; ; attempt++) {
      const response = await this.slot(() =>
        this.fetchFn(url, { ...init, headers }),
      );
      if (response.status === 429 && attempt < MAX_RETRIES) {
        await sleep(this.interval * 2 ** (attempt + 1));
        continue;
      }
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new TonCenterError(
          `TonCenter answered ${response.status}${text ? `: ${text.slice(0, 200)}` : ""}`,
          response.status,
        );
      }
      return (await response.json()) as T;
    }
  }

  /** Runs `task` once the previous request has had its share of the rate. */
  private slot<T>(task: () => Promise<T>): Promise<T> {
    const run = this.queue.then(async () => {
      const wait = this.lastSent + this.interval - Date.now();
      if (wait > 0) await sleep(wait);
      this.lastSent = Date.now();
    });
    this.queue = run.catch(() => undefined);
    return run.then(task);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
