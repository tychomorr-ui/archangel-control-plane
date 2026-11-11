export type Attestation = {
  schema: string;
  artifact: string;
  artifactHash: string;
  generatedAt: string;
  signer: string;
  publicKeyDerBase64: string;
  statement: string;
  signature: string;
};

export type AttestationVerification = {
  status: "verified" | "failed" | "unavailable";
  detail: string;
};

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = window.atob(normalized);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

function encodeHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function verifyAdversarialAttestation(attestation: Attestation, reportBytes: string): Promise<AttestationVerification> {
  if (!window.crypto?.subtle) return { status: "unavailable", detail: "Web Crypto is unavailable in this browser." };
  try {
    const reportHash = `sha256:${encodeHex(await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(reportBytes)))}`;
    if (reportHash !== attestation.artifactHash) return { status: "failed", detail: "The report hash does not match the attestation." };
    const signedBody = {
      schema: attestation.schema,
      artifact: attestation.artifact,
      artifactHash: attestation.artifactHash,
      generatedAt: attestation.generatedAt,
      signer: attestation.signer,
      publicKeyDerBase64: attestation.publicKeyDerBase64,
      statement: attestation.statement,
    };
    const publicKey = await window.crypto.subtle.importKey("spki", decodeBase64Url(attestation.publicKeyDerBase64), { name: "Ed25519" }, false, ["verify"]);
    const valid = await window.crypto.subtle.verify({ name: "Ed25519" }, publicKey, decodeBase64Url(attestation.signature), new TextEncoder().encode(JSON.stringify(signedBody, null, 2) + "\n"));
    return valid
      ? { status: "verified", detail: "Signature and report hash verified locally." }
      : { status: "failed", detail: "The Ed25519 signature is invalid." };
  } catch {
    return { status: "unavailable", detail: "This browser could not complete Ed25519 verification." };
  }
}
