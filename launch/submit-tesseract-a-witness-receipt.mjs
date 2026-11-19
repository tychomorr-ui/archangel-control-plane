#!/usr/bin/env node

const archangelBaseUrl = process.argv[2] ?? process.env.ARCHANGEL_BASE_URL;
const tesseractBaseUrl = process.argv[3] ?? process.env.TESSERACT_A_BASE_URL ?? "http://127.0.0.1:4170";

if (!archangelBaseUrl) {
  console.error("Usage: node launch/submit-tesseract-a-witness-receipt.mjs <archangel-base-url> [tesseract-a-base-url]");
  process.exit(2);
}

const join = (base, path) => `${base.replace(/\/$/, "")}${path}`;
const requestJson = async (url, init = {}) => {
  const response = await fetch(url, { ...init, headers: { accept: "application/json", ...(init.body ? { "content-type": "application/json" } : {}), ...(init.headers ?? {}) } });
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { raw: text.slice(0, 500) }; }
  if (!response.ok) {
    const error = new Error(`${response.status} ${url}`);
    error.response = body;
    throw error;
  }
  return body;
};

try {
  const challenge = await requestJson(join(archangelBaseUrl, "/v1/atmos/witnesses/tesseract-a/challenge"), { method: "POST" });
  const signed = await requestJson(join(tesseractBaseUrl, "/api/witness/receipt"), {
    method: "POST",
    body: JSON.stringify({ challengeId: challenge.challengeId, nonce: challenge.nonce, expiresAt: challenge.expiresAt }),
  });
  const accepted = await requestJson(join(archangelBaseUrl, "/v1/atmos/witnesses/tesseract-a/receipts"), {
    method: "POST",
    body: JSON.stringify({ receipt: signed.receipt }),
  });
  console.log(JSON.stringify({
    flow: "ARCHANGEL_CHALLENGE -> TESSERACT_A_LOCAL_PROBE_AND_SIGN -> ARCHANGEL_WITNESS_INTAKE",
    challenge: { challengeId: challenge.challengeId, expiresAt: challenge.expiresAt, registeredPublicKeyFingerprint: challenge.registeredPublicKeyFingerprint },
    probe: { resultCount: Array.isArray(signed.probeResults) ? signed.probeResults.length : 0, verifiedCount: Array.isArray(signed.probeResults) ? signed.probeResults.filter(result => result.outcome === "VERIFIED").length : 0 },
    accepted,
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ error: error instanceof Error ? error.message : String(error), response: error?.response ?? null }, null, 2));
  process.exit(1);
}
