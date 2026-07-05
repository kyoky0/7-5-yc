import { createEnclaveTransport } from "./transport";
import { createRouter } from "./server";

const transport = createEnclaveTransport();
const vsockActive = transport.name === "vsock";
const route = createRouter(vsockActive);

console.log(`[enclave] starting Serendipity Cross-Industry Match Engine (transport=${transport.name})`);
transport.start(route);

process.on("SIGTERM", () => {
  console.log("[enclave] SIGTERM received, shutting down");
  transport.stop();
  process.exit(0);
});
