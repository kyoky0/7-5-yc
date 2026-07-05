import fs from "node:fs";
import { loadMeasurement } from "./measurement";

const NSM_DEVICE_PATH = "/dev/nsm";

export function nsmDevicePresent(): boolean {
  try {
    return fs.existsSync(NSM_DEVICE_PATH);
  } catch {
    return false;
  }
}

export interface AttestationDocument {
  mode: "nsm" | "mock";
  moduleId: string;
  pcrs: Record<string, string>;
  documentBase64: string;
}

/**
 * Returns an attestation document describing this enclave instance.
 *
 * Real integration: when /dev/nsm is present, call the NSM driver
 * (e.g. via `aws-nitro-enclaves-nsm-api` crate) to obtain a CBOR/COSE_Sign1
 * document signed by the AWS Nitro Attestation PKI. In this build the
 * returned document is a structured mock built from real measurement values
 * when built via `nitro-cli build-enclave`.
 */
export function getAttestationDocument(nonce?: string): AttestationDocument {
  const measurement = loadMeasurement();

  if (nsmDevicePresent()) {
    console.log("[enclave] /dev/nsm present: running inside a real Nitro Enclave");
  }

  return {
    mode: "mock",
    moduleId: "serendipity-match-engine",
    pcrs: measurement.pcrs,
    documentBase64: Buffer.from(
      JSON.stringify({
        note: "mock attestation document -- real NSM/CBOR signing not implemented",
        nonce: nonce ?? null,
        pcrs: measurement.pcrs,
        measurementSource: measurement.source,
      })
    ).toString("base64"),
  };
}
