import net from "node:net";
import { NdjsonDecoder, encodeMessage, type RpcRequest, type RpcResponse } from "@serendipity/common";

export interface EnclaveClient {
  readonly transportName: string;
  send(request: RpcRequest, timeoutMs?: number): Promise<RpcResponse>;
}

/**
 * Creates a client that talks to the enclave over vsock or TCP.
 * In production: vsock (AF_VSOCK to the enclave CID).
 * In dev: TCP loopback to the enclave's dev server.
 */
export function createEnclaveClient(): EnclaveClient {
  const transport = process.env.ENCLAVE_TRANSPORT ?? "tcp";
  const cid = parseInt(process.env.ENCLAVE_CID ?? "16", 10);
  const port = parseInt(process.env.ENCLAVE_PORT ?? "5005", 10);

  if (transport === "vsock") {
    return createVsockClient(cid, port);
  }

  return createTcpClient(port);
}

function createTcpClient(port: number): EnclaveClient {
  return {
    transportName: "tcp-dev",
    send(request: RpcRequest, timeoutMs = 10000): Promise<RpcResponse> {
      return new Promise((resolve, reject) => {
        const socket = net.createConnection({ host: "127.0.0.1", port });
        const decoder = new NdjsonDecoder();
        const timer = setTimeout(() => {
          socket.destroy();
          reject(new Error(`enclave timeout after ${timeoutMs}ms`));
        }, timeoutMs);

        socket.on("data", (chunk) => {
          const messages = decoder.push(chunk);
          for (const msg of messages) {
            clearTimeout(timer);
            socket.end();
            resolve(msg as RpcResponse);
          }
        });

        socket.on("error", (err) => {
          clearTimeout(timer);
          reject(err);
        });

        socket.write(encodeMessage(request));
      });
    },
  };
}

function createVsockClient(cid: number, port: number): EnclaveClient {
  return {
    transportName: `vsock (cid=${cid}, port=${port})`,
    send(request: RpcRequest, timeoutMs = 10000): Promise<RpcResponse> {
      return new Promise((resolve, reject) => {
        const { VsockSocket } = require("node-vsock") as {
          VsockSocket: new (cid: number, port: number) => net.Socket;
        };

        const socket = new VsockSocket(cid, port);
        const decoder = new NdjsonDecoder();
        const timer = setTimeout(() => {
          socket.destroy();
          reject(new Error(`enclave timeout after ${timeoutMs}ms`));
        }, timeoutMs);

        socket.on("data", (chunk: Buffer) => {
          const messages = decoder.push(chunk);
          for (const msg of messages) {
            clearTimeout(timer);
            socket.end();
            resolve(msg as RpcResponse);
          }
        });

        socket.on("error", (err: Error) => {
          clearTimeout(timer);
          reject(err);
        });

        socket.write(encodeMessage(request));
      });
    },
  };
}
