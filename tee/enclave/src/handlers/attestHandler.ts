import type { AttestRequest, AttestResponse } from "@serendipity/common";
import { getAttestationDocument } from "../attestation/nsm";
import { loadMeasurement } from "../attestation/measurement";
import { computePolicyHash } from "../attestation/policy";
import { runAttestationChecks } from "../attestation/checks";

export function handleAttest(payload: AttestRequest, vsockActive: boolean): AttestResponse {
  getAttestationDocument(payload.nonce);
  const measurement = loadMeasurement();

  return {
    attested: true,
    teeType: "aws-nitro-enclaves",
    enclaveReady: true,
    workloadMeasurement: measurement.workloadMeasurement,
    policyHash: computePolicyHash(),
    checks: runAttestationChecks(vsockActive),
  };
}
