type DataPiece = {
  ts: number;
  ttl: number;
  data: string;
};

// Save the original stringify method
const originalStringify = JSON.stringify;

// Override JSON.stringify to handle BigInt
JSON.stringify = function (value, replacer, space) {
  // Create a custom replacer function that handles BigInt
  const bigintReplacer = (key: string, value: unknown) => {
    // If the value is a BigInt, convert it to a string
    if (typeof value === "bigint") {
      return value.toString() + "n"; // Append 'n' to indicate it's a BigInt
    }

    // If a custom replacer was provided, apply it after our BigInt handling
    if (typeof replacer === "function") {
      return replacer(key, value);
    } else if (Array.isArray(replacer)) {
      // If replacer is an array, check if the key is in it
      if (key === "" || replacer.includes(key)) {
        return value;
      }
      return undefined;
    }

    // For all other values, return as is
    return value;
  };

  // Call the original stringify with our enhanced replacer
  return originalStringify(value, bigintReplacer, space);
};

// Save the original parse method
const originalParse = JSON.parse;

// Override JSON.parse to handle BigInt strings
JSON.parse = function (text, reviver) {
  // Create a BigInt reviver function
  const bigintReviver = (key: string, value: unknown) => {
    // Check if the value is a string and matches a BigInt pattern
    if (typeof value === "string" && /^-?\d+n$/.test(value)) {
      // Remove the 'n' suffix and convert to BigInt
      return BigInt(value.slice(0, -1));
    }

    // Apply the original reviver if provided
    if (typeof reviver === "function") {
      return reviver(key, value);
    }

    return value;
  };

  // Call the original parse with our enhanced reviver
  return originalParse(text, bigintReviver);
};

export class NetworkCache {
  defaultTtl: number;
  prefix: string;

  constructor(defaultTtl: number, prefix: string = "network-cache-") {
    this.defaultTtl = defaultTtl;
    this.prefix = prefix;
  }

  get time() {
    return Date.now();
  }

  async get<T>(
    key: string,
    getNewValue: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const fullKey = this.getFullKey(key);
    if (this.needsUpdate(fullKey)) {
      return this.save<T>(fullKey, getNewValue(), ttl);
    }

    return this.retrieve<T>(fullKey);
  }

  needsUpdate(key: string, force?: boolean): boolean {
    if (force) {
      return force;
    }

    const piece = this.getDataPiece(key);

    if (!piece) {
      return true;
    }

    return this.time - piece.ts >= piece.ttl;
  }

  async retrieve<T>(key: string): Promise<T> {
    const piece = this.getDataPiece(key);
    if (!piece) {
      throw new Error("Data not found");
    }

    try {
      const parsedData = JSON.parse(piece.data);
      return this.deserializeData(parsedData) as T;
    } catch (error) {
      console.error(`Failed to parse cached data for key ${key}:`, error);
      throw new Error("Invalid cached data");
    }
  }

  async save<T>(key: string, data: Promise<T> | T, ttl?: number): Promise<T> {
    try {
      // Handle both Promise and direct value cases
      const resolvedData = data instanceof Promise ? await data : data;

      // Skip caching if data is undefined or null
      if (resolvedData === undefined || resolvedData === null) {
        console.warn(
          `Skipping cache save for ${key}: data is ${String(resolvedData)}`
        );
        return resolvedData;
      }

      // Handle BigInt and other non-serializable values
      const safeData = this.sanitizeForSerialization(resolvedData);
      const serializedData = JSON.stringify(safeData);

      const dataPiece: DataPiece = {
        ts: this.time,
        ttl: ttl ?? this.defaultTtl,
        data: serializedData,
      };

      localStorage.setItem(key, JSON.stringify(dataPiece));
      return resolvedData;
    } catch (error) {
      console.error("Failed to save data:", error);
      // Don't fail the operation if cache save fails
      const resolvedData = data instanceof Promise ? await data : data;
      return resolvedData;
    }
  }

  pop<T>(key: string): T | undefined {
    const fullKey = this.getFullKey(key);
    const piece = this.getDataPiece(fullKey);
    localStorage.removeItem(fullKey);
    return piece ? JSON.parse(piece.data) : undefined;
  }

  get size() {
    return Object.keys(localStorage).filter(key => key.startsWith(this.prefix))
      .length;
  }

  cleanup() {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.prefix)) {
        const piece = this.getDataPiece(key);
        if (piece && this.needsUpdate(key)) {
          this.pop(key);
        }
      }
    });
  }

  clear(methodsToClear?: string[]) {
    if (!methodsToClear) {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
      return;
    }

    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.prefix)) {
        const keyParts = key.split("-").slice(0, 3).join("-");
        if (methodsToClear.some(method => keyParts === method)) {
          localStorage.removeItem(key);
        }
      }
    });
  }

  private getFullKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  private getDataPiece(key: string): DataPiece | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Failed to parse data for key ${key}:`, error);
      return null;
    }
  }

  // Helper method to handle non-serializable values
  private sanitizeForSerialization<T>(data: T): unknown {
    if (data === null || data === undefined) {
      return data;
    }

    // Handle BigInt
    if (typeof data === "bigint") {
      return { __type: "bigint", value: data.toString() };
    }

    // Handle Date objects
    if (data instanceof Date) {
      return { __type: "Date", value: data.toISOString() };
    }

    // Handle Arrays
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeForSerialization(item));
    }

    // Handle plain objects
    if (typeof data === "object") {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        result[key] = this.sanitizeForSerialization(value);
      }
      return result;
    }

    // Primitive values can be safely returned as-is
    return data;
  }

  // Helper method to deserialize previously sanitized data
  private deserializeData(data: unknown): unknown {
    if (data === null || typeof data !== "object") {
      return data;
    }

    // Handle our custom serialized types
    if (this.isSerializedBigInt(data)) {
      return BigInt(data.value);
    }

    if (this.isSerializedDate(data)) {
      return new Date(data.value);
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => this.deserializeData(item));
    }

    // Handle plain objects
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = this.deserializeData(value);
    }
    return result;
  }

  // Type guards for our custom serialized types
  private isSerializedBigInt(
    data: unknown
  ): data is { __type: "bigint"; value: string } {
    return (
      typeof data === "object" &&
      data !== null &&
      "__type" in data &&
      (data as Record<string, unknown>).__type === "bigint" &&
      "value" in data &&
      typeof (data as Record<string, unknown>).value === "string"
    );
  }

  private isSerializedDate(
    data: unknown
  ): data is { __type: "Date"; value: string } {
    return (
      typeof data === "object" &&
      data !== null &&
      "__type" in data &&
      (data as Record<string, unknown>).__type === "Date" &&
      "value" in data &&
      typeof (data as Record<string, unknown>).value === "string"
    );
  }
}
