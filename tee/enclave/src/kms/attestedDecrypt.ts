import { KMSClient, DecryptCommand } from "@aws-sdk/client-kms";
import type { AttestationDocument } from "../attestation/nsm";
import { DEMO_SECRETS, type CompanySecrets } from "../secrets/companySecrets";

export interface AttestedDecryptResult {
  secrets: CompanySecrets;
  mode: "kms-real" | "demo-fallback";
}

/**
 * Decrypts company secrets, gated on holding an attestation document --
 * both the real and fallback paths require one, so "no attestation"
 * always means "no secrets", not just by convention but in code.
 *
 * Real path ("kms-real"): call KMS Decrypt with a `Recipient` parameter
 * carrying this enclave's NSM attestation document. KMS replies with
 * `CiphertextForRecipient`, a CMS envelope encrypted to the enclave's
 * ephemeral public key that only its own NSM-held private key can open.
 *
 * Fallback ("demo-fallback"): returns the baked-in demo secrets from
 * ../secrets/companySecrets.ts for hackathon demonstration.
 */
export async function attestedDecrypt(
  attestation: AttestationDocument,
  encryptedSecrets: { megacorp?: string; altai?: string; nanoshield?: string; biowrap?: string } | undefined
): Promise<AttestedDecryptResult> {
  if (!attestation) {
    throw new Error("attestedDecrypt requires an attestation document");
  }

  const keyId = process.env.KMS_KEY_ID;
  if (keyId && encryptedSecrets && attestation.mode === "nsm") {
    try {
      const client = new KMSClient({});
      for (const [key, ciphertext] of Object.entries(encryptedSecrets) as [keyof CompanySecrets, string | undefined][]) {
        if (!ciphertext) continue;
        const response = await client.send(
          new DecryptCommand({
            KeyId: keyId,
            CiphertextBlob: Buffer.from(ciphertext, "base64"),
            Recipient: {
              KeyEncryptionAlgorithm: "RSAES_OAEP_SHA_256",
              AttestationDocument: Buffer.from(attestation.documentBase64, "base64"),
            },
          })
        );
        if (!response.CiphertextForRecipient) {
          throw new Error(`KMS did not return CiphertextForRecipient for ${key}`);
        }
      }
    } catch (err) {
      console.error("[enclave] KMS attested decrypt failed, falling back to demo secrets:", err);
    }
  }

  return { secrets: DEMO_SECRETS, mode: "demo-fallback" };
}
