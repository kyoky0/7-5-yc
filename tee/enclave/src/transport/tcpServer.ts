import net from "node:net";
import { NdjsonDecoder, encodeMessage, type RpcRequest } from "@serendipity/common";
import type { EnclaveTransport, RequestHandler } from "./types";

/**
 * Local-development stand-in for the vsock transport. Same NDJSON framing,
 * same request/response shape -- only the underlying socket family differs.
 */
export class TcpDevTransport implements EnclaveTransport {
  readonly name = "tcp-dev";
  private server?: net.Server;

  constructor(private readonly port: number) {}

  start(handler: RequestHandler): void {
    this.server = net.createServer((socket) => {
      const decoder = new NdjsonDecoder();

      socket.on("data", (chunk) => {
        let messages: unknown[];
        try {
          messages = decoder.push(chunk);
        } catch (err) {
          socket.destroy(err instanceof Error ? err : new Error(String(err)));
          return;
        }

        for (const message of messages) {
          void handler(message as RpcRequest).then((response) => {
            socket.write(encodeMessage(response));
          });
        }
      });

      socket.on("error", () => {});
    });

    this.server.listen(this.port, "127.0.0.1", () => {
      console.log(`[enclave] tcp-dev transport listening on 127.0.0.1:${this.port}`);
    });
  }

  stop(): void {
    this.server?.close();
  }
}
