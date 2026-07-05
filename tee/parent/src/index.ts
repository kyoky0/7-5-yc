import express from "express";
import cors from "cors";
import { createRoutes } from "./routes";
import { createEnclaveClient } from "./transport";

const port = parseInt(process.env.PORT ?? "3001", 10);
const client = createEnclaveClient();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/enclave", createRoutes(client));

app.listen(port, () => {
  console.log(`[parent] Serendipity Parent EC2 API listening on :${port}`);
  console.log(`[parent] Enclave transport: ${client.transportName}`);
});
