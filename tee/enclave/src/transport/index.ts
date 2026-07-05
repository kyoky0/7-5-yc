import type { EnclaveTransport } from "./types";

export function createEnclaveTransport(): EnclaveTransport {
  const transport = process.env.ENCLAVE_TRANSPORT ?? "tcp";
  const port = parseInt(process.env.ENCLAVE_PORT ?? "5005", 10);

  if (transport === "vsock") {
    const { VsockTransport } = require("./vsockServer");
    return new VsockTransport(port);
  }

  const { TcpDevTransport } = require("./tcpServer");
  return new TcpDevTransport(port);
}
