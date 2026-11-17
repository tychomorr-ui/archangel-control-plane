import type { Express, Request, Response } from "express";

const ARCHANGEL_IDENTITY = {
  schema: "NEXINUS_ATMOS_SIGNED_NODE_MANIFEST/v1",
  manifestVersion: "ATMOS-1.1.1",
  manifestId: "atmos-node-archangel",
  nodeId: "ARCHANGEL",
  displayName: "ARCHANGEL",
  declaredRegion: "London",
  declaredRole: "control plane · mesh governance",
  declaredCanonicalUrl: "https://archangel.nexinus.net",
  capabilities: ["CONTROL_PLANE", "MESH_GOVERNANCE"],
  distinctFrom: [],
  applicationBoundary: "RUNNING_GOVERNANCE_SERVER",
  identity: {
    algorithm: "Ed25519",
    publicKeyPem: "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAK4tYXT9RHNgOv/5YacGaFxjmmcCQaVj10TXDNMdnqcc=\n-----END PUBLIC KEY-----\n",
    identityHash: "5a7d0be5747b2a61bbe4a5d95772ae50a469688e85d40028b501c893dea2013a",
    publicKeyFingerprintSha256: "5a7d0be5747b2a61bbe4a5d95772ae50a469688e85d40028b501c893dea2013a",
    signerReference: "operator-atmos-ed25519-controlled-20261027",
  },
  hashes: {
    publicKeyFingerprintSha256: "5a7d0be5747b2a61bbe4a5d95772ae50a469688e85d40028b501c893dea2013a",
    identityDocumentSha256: "1500ade86f2a139ee3c4e6b63dc8bbbb488d7c4a6e234fb99bc7aee1e9c102d9",
    artifactSha256: "651d1805a7da2f5907657d2a48f0be28572e8c25d86075f09ee5c11cfa6ee2d4",
  },
  signedAt: "2026-10-28T20:12:16Z",
  verification: {
    manifestStatus: "SIGNED_PUBLIC_MANIFEST",
    headStatus: "NOT_RUN",
    trustState: "SIGNED_NOT_PROBED",
    authority: "NOT_CONFIGURED",
    network: "UNKNOWN",
  },
  boundary: "SIGNATURE_PROVES_CONTROL_OF_KEY_ONLY",
  payloadHash: "26b3bf7b6a118ed8d191aae4550b35a157e9c361bc186bd4dd241d590b516780",
  signature: "NnHIiqJa3Ov7sTjAzxjoHgAD2vWc63Ka81zwG6m/c5F4bdtxGI+F7gEav1qTD1vs/BWL+mP4x9KwKQiqVBFjAA==",
} as const;

const ARCHANGEL_ARTIFACT = {
  schema: "NEXINUS_ATMOS_PUBLISHED_ARTIFACT/v1",
  nodeId: "ARCHANGEL",
  artifactKind: "running-node-bundle",
  artifactPath: "/opt/atmos-governance/atmos-governance-server.mjs",
  canonicalUrl: "https://archangel.nexinus.net",
  boundary: "The signed health response binds the running governance server. This file is a label, not the measured artifact.",
} as const;

const ARCHANGEL_GOVERNANCE = {
  schema: "NEXINUS_ATMOS_GOVERNANCE/v1",
  nodeId: "ARCHANGEL",
  manifestVersion: "ATMOS-1.1.1",
  policy: "PUBLIC_NOOP_ADMIT_AND_BIND",
  endpoint: "https://archangel.nexinus.net/governance/noop",
  admitEndpoint: "https://archangel.nexinus.net/governance/admit",
  bindEndpoint: "https://archangel.nexinus.net/governance/bind-artifact",
  accepts: ["NOOP", "ADMIT", "BIND_ARTIFACT"],
  replay: "REJECT_DUPLICATE_REQUEST_HASH",
  publicKeyPem: "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAK4tYXT9RHNgOv/5YacGaFxjmmcCQaVj10TXDNMdnqcc=\n-----END PUBLIC KEY-----\n",
  publicKeyFingerprintSha256: "5a7d0be5747b2a61bbe4a5d95772ae50a469688e85d40028b501c893dea2013a",
  signedAt: "2026-10-28T20:12:16Z",
  boundary: "NOOP changes no node. ADMIT records one new node request and rejects replay. BIND_ARTIFACT updates only the artifact hash of an already admitted node. Neither publishes DNS nor marks a node VERIFIED.",
  payloadHash: "e1e3ef80426723eacf8b01341482e174e909f8adf2cc3f8384eb06586a7c0066",
  signature: "VIrb7fBxpCKUEta9QqFumwygEEf7w4WSaPF73ef4CS7zxMOpuhiE6YQVEukGcOgoOEWxkBP5Db7xhjHVNXN9Bg==",
} as const;

function sendEvidence(res: Response, body: unknown, status = 200) {
  res.status(status).type("application/json").set("Cache-Control", "no-store").json(body);
}

export function registerAtmosPublicEvidenceRoutes(app: Express) {
  app.get("/.well-known/atmos-identity.json", (_req: Request, res: Response) => {
    sendEvidence(res, ARCHANGEL_IDENTITY);
  });

  app.get("/.well-known/atmos-artifact.json", (_req: Request, res: Response) => {
    sendEvidence(res, ARCHANGEL_ARTIFACT);
  });

  app.get("/governance", (_req: Request, res: Response) => {
    sendEvidence(res, ARCHANGEL_GOVERNANCE);
  });

  app.get("/health", (_req: Request, res: Response) => {
    sendEvidence(res, {
      schema: "NEXINUS_ATMOS_SIGNED_HEALTH/v1",
      nodeId: "ARCHANGEL",
      status: "down",
      reason: "ATMOS health signing is not configured for the current running artifact",
      boundary: "NO_UNSIGNED_HEALTH_CLAIM",
    }, 503);
  });
}

export const atmosPublicEvidence = {
  identity: ARCHANGEL_IDENTITY,
  artifact: ARCHANGEL_ARTIFACT,
  governance: ARCHANGEL_GOVERNANCE,
} as const;
