/**
 * Newline-delimited JSON framing for the vsock / TCP-loopback transports.
 *
 * Both AF_VSOCK and TCP are stream sockets: a single write() on one side can
 * arrive as multiple 'data' events on the other, and multiple writes can be
 * coalesced into one. NDJSON framing (one JSON value per line) is the
 * simplest correct way to recover message boundaries over either transport.
 */

export function encodeMessage(value: unknown): string {
  return `${JSON.stringify(value)}\n`;
}

export class NdjsonDecoder {
  private buffer = "";

  push(chunk: Buffer | string): unknown[] {
    this.buffer += typeof chunk === "string" ? chunk : chunk.toString("utf8");

    const values: unknown[] = [];
    let newlineIndex: number;
    while ((newlineIndex = this.buffer.indexOf("\n")) !== -1) {
      const line = this.buffer.slice(0, newlineIndex);
      this.buffer = this.buffer.slice(newlineIndex + 1);
      if (line.trim().length === 0) continue;
      values.push(JSON.parse(line));
    }
    return values;
  }
}
