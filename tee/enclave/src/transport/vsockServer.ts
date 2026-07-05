import { NdjsonDecoder, encodeMessage, type RpcRequest } from "@serendipity/common";
import type { EnclaveTransport, RequestHandler } from "./types";

interface VsockSocketLike {
  on(event: "data", cb: (buf: Buffer) => void): void;
  on(event: "error", cb: (err: Error) => void): void;
  writeTextSync(data: string): void;
  end(): void;
}
interface VsockServerLike {
  on(event: "connection", cb: (socket: VsockSocketLike) => void): void;
  on(event: "error", cb: (err: Error) => void): void;
  listen(port: number): void;
  close(): void;
}

/**
 * Real AF_VSOCK server. This is the transport the enclave runner uses in
 * production: it binds a vsock port and accepts connections from the
 * Parent EC2 instance (the only channel in or out of a Nitro Enclave).
 */
export class VsockTransport implements EnclaveTransport {
  readonly name = "vsock";
  private server?: VsockServerLike;

  constructor(private readonly port: number) {}

  start(handler: RequestHandler): void {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { VsockServer } = require("node-vsock") as {
      VsockServer: new () => VsockServerLike;
    };

    this.server = new VsockServer();

    this.server.on("error", (err) => {
      console.error("[enclave] vsock server error:", err.message);
    });

    this.server.on("connection", (socket) => {
      const decoder = new NdjsonDecoder();

      socket.on("error", (err) => {
        console.error("[enclave] vsock socket error:", err.message);
      });

      socket.on("data", (buf) => {
        let messages: unknown[];
        try {
          messages = decoder.push(buf);
        } catch (err) {
          console.error("[enclave] failed to decode vsock message:", err);
          return;
        }

        for (const message of messages) {
          void handler(message as RpcRequest).then((response) => {
            socket.writeTextSync(encodeMessage(response));
          });
        }
      });
    });

    this.server.listen(this.port);
    console.log(`[enclave] vsock transport listening on port ${this.port} (CID_ANY)`);
  }

  stop(): void {
    this.server?.close();
  }
}
