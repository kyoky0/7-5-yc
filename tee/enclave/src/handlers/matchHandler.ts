import type { MatchRequest, MatchResponse } from "@serendipity/common";
import { getAttestationDocument } from "../attestation/nsm";
import { attestedDecrypt } from "../kms/attestedDecrypt";
import { runMatchPipeline } from "../discovery/pipeline";

export async function handleMatch(payload: MatchRequest): Promise<MatchResponse> {
  const attestation = getAttestationDocument(payload.attestationToken);
  const { secrets } = await attestedDecrypt(attestation, payload.encryptedSecrets);
  return runMatchPipeline(payload.sessionId, secrets);
}
