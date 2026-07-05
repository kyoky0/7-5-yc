import type { RpcRequest, RpcResponse } from "@serendipity/common";

export type RequestHandler = (req: RpcRequest) => Promise<RpcResponse>;

export interface EnclaveTransport {
  readonly name: string;
  start(handler: RequestHandler): void;
  stop(): void;
}
