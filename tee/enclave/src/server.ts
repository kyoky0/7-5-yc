import type { RpcRequest, RpcResponse } from "@serendipity/common";
import { handleAttest } from "./handlers/attestHandler";
import { handleMatch } from "./handlers/matchHandler";

export function createRouter(vsockActive: boolean) {
  return async function route(req: RpcRequest): Promise<RpcResponse> {
    const id = (req as { id?: string }).id ?? "unknown";
    try {
      switch (req.type) {
        case "attest": {
          const result = handleAttest(req.payload, vsockActive);
          return { id, ok: true, result };
        }
        case "match": {
          const result = await handleMatch(req.payload);
          return { id, ok: true, result };
        }
        default:
          return { id, ok: false, error: `unknown request type: ${String((req as { type?: string }).type)}` };
      }
    } catch (err) {
      console.error("[enclave] handler error:", err);
      return { id, ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  };
}
