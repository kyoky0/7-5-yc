import fs from "node:fs";
import path from "node:path";

export interface Measurement {
  workloadMeasurement: string;
  pcrs: Record<string, string>;
  source: "build-output" | "env" | "mock";
}

/**
 * `scripts/build-eif.sh` runs `nitro-cli build-enclave` and writes its JSON
 * output (which contains the real PCR0/PCR1/PCR2 measurements of the built
 * EIF) to this file. When present, the measurement below is the genuine
 * hash of the deployed enclave image -- not a placeholder.
 */
const MEASUREMENTS_FILE = path.resolve(__dirname, "..", "..", "measurements.json");

interface NitroCliBuildOutput {
  Measurements?: {
    PCR0?: string;
    PCR1?: string;
    PCR2?: string;
  };
}

export function loadMeasurement(): Measurement {
  if (fs.existsSync(MEASUREMENTS_FILE)) {
    try {
      const raw = JSON.parse(fs.readFileSync(MEASUREMENTS_FILE, "utf8")) as NitroCliBuildOutput;
      const pcr0 = raw.Measurements?.PCR0;
      if (pcr0) {
        return {
          workloadMeasurement: pcr0,
          pcrs: {
            PCR0: raw.Measurements?.PCR0 ?? "",
            PCR1: raw.Measurements?.PCR1 ?? "",
            PCR2: raw.Measurements?.PCR2 ?? "",
          },
          source: "build-output",
        };
      }
    } catch (err) {
      console.error("[enclave] failed to parse measurements.json:", err);
    }
  }

  if (process.env.ENCLAVE_PCR0) {
    return {
      workloadMeasurement: process.env.ENCLAVE_PCR0,
      pcrs: { PCR0: process.env.ENCLAVE_PCR0 },
      source: "env",
    };
  }

  return {
    workloadMeasurement: "mock-pcr0-not-built-via-nitro-cli",
    pcrs: { PCR0: "mock-pcr0-not-built-via-nitro-cli" },
    source: "mock",
  };
}
