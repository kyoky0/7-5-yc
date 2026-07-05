import { Router } from "express";
import crypto from "node:crypto";
import type { AttestRequest, MatchRequest, RpcRequest } from "@serendipity/common";
import type { EnclaveClient } from "./transport";

/**
 * The Parent EC2 API is a pure relay: it builds an RPC envelope, forwards it
 * to the enclave over vsock/tcp, and returns exactly what the enclave sends
 * back. It never inspects, decrypts, or logs secret content.
 */
export function createRoutes(client: EnclaveClient) {
  const router = Router();

  router.post("/attest", async (req, res) => {
    const payload: AttestRequest = req.body ?? {};
    const rpcReq: RpcRequest = { id: crypto.randomUUID(), type: "attest", payload };

    try {
      const response = await client.send(rpcReq);
      if (!response.ok) {
        res.status(502).json({ error: response.error });
        return;
      }
      res.json(response.result);
    } catch (err) {
      res.status(502).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  router.post("/match", async (req, res) => {
    const payload = req.body as MatchRequest;
    if (!payload?.sessionId) {
      res.status(400).json({ error: "sessionId is required" });
      return;
    }

    const rpcReq: RpcRequest = { id: crypto.randomUUID(), type: "match", payload };

    try {
      const response = await client.send(rpcReq, 30000);
      if (!response.ok) {
        res.status(502).json({ error: response.error });
        return;
      }
      res.json(response.result);
    } catch (err) {
      res.status(502).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  router.get("/health", (_req, res) => {
    res.json({ ok: true, service: "serendipity-parent-relay" });
  });

  return router;
}
