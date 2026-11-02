import {
  createHash,
  createPrivateKey,
  createPublicKey,
  randomUUID,
  sign,
  verify,
  type KeyObject,
} from "node:crypto";

export const REFRESH_SIGNED_STATUS = "REFRESH_SIGNED_STATUS" as const;
export const REFRESH_SIGNED_STATUS_CONTRACT = "ARCHANGEL_REFRESH_SIGNED_STATUS/v1" as const;
export const REFRESH_SIGNED_STATUS_SCOPE = "read:health" as const;

export type RefreshStatus = "ok" | "degraded" | "not_ready";
export type EvidenceClass = "OBSERVED" | "DERIVED" | "INFERRED" | "AUTHORIZED";

export type RefreshPayload = {
  requestedFields: readonly ["status", "version", "capabilities"];
  reason: string;
};

export type RefreshDispatchEnvelope = {
  schema: typeof REFRESH_SIGNED_STATUS_CONTRACT;
  dispatchId: string;
  requestId: string;
  challengeId: string;
  nonce: string;
  issuedAt: string;
  expiresAt: string;
  archangelNodeId: "ARCHANGEL";
  targetNodeId: string;
  operation: typeof REFRESH_SIGNED_STATUS;
  contractVersion: "1";
  requiredScope: typeof REFRESH_SIGNED_STATUS_SCOPE;
  operatorKeyReference: string;
  authorizationContext: "operator-approved";
  payload: RefreshPayload;
  payloadHash: string;
  dispatchHash: string;
  dispatchSignature: string;
};

export type RefreshExecutionResult = {
  status: RefreshStatus;
  version: string;
  capabilities: string[];
  evidenceHash: string;
  observedAt: string;
};

export type RefreshReceipt = {
  schema: "ARCHANGEL_REFRESH_SIGNED_STATUS_RECEIPT/v1";
  receiptId: string;
  requestId: string;
  dispatchId: string;
  operation: typeof REFRESH_SIGNED_STATUS;
  targetNodeId: string;
  success: boolean;
  result: RefreshExecutionResult | null;
  failureReason: string | null;
  executionStartedAt: string;
  executionCompletedAt: string;
  originalDispatchHash: string;
  signerIdentity: string;
  nodePublicKeyFingerprint: string;
  challengeId: string;
  receiptHash: string;
  nodeSignature: string;
};

export type RefreshAuditEvent = {
  eventType:
    | "conductor.authorization"
    | "conductor.dispatch"
    | "conductor.validation"
    | "conductor.execution"
    | "conductor.receipt"
    | "conductor.final_decision";
  outcome: "accepted" | "rejected" | "verified" | "failed" | "timeout";
  requestId: string;
  targetNodeId: string;
  operation: typeof REFRESH_SIGNED_STATUS;
  evidenceClass: EvidenceClass;
  summary: string;
  occurredAt: string;
};

export type RefreshNodeAdapter = {
  refreshSignedStatus(
    dispatch: RefreshDispatchEnvelope,
    signal: AbortSignal,
  ): Promise<{ result: RefreshExecutionResult; receipt: RefreshReceipt }>;
};

export type RefreshConductorInput = {
  dispatch: RefreshDispatchEnvelope;
  now?: Date;
  archangelPublicKey: KeyObject | string;
  nodePublicKey: KeyObject | string;
  nodePublicKeyFingerprint: string;
  nodeAdapter: RefreshNodeAdapter;
  signal?: AbortSignal;
};

export type RefreshConductorOutput = {
  receipt: RefreshReceipt;
  audit: RefreshAuditEvent[];
};

const MAX_CLOCK_SKEW_MS = 30_000;
const MAX_WINDOW_MS = 60_000;

function canonical(value: unknown): string {
  return JSON.stringify(value);
}

function sha256(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function unsignedDispatch(dispatch: RefreshDispatchEnvelope) {
  const {
    dispatchHash: _dispatchHash,
    dispatchSignature: _dispatchSignature,
    ...unsigned
  } = dispatch;
  return unsigned;
}

function unsignedReceipt(receipt: RefreshReceipt) {
  const { receiptHash: _receiptHash, nodeSignature: _nodeSignature, ...unsigned } = receipt;
  return unsigned;
}

function keyFingerprint(publicKey: KeyObject | string): string {
  const key = typeof publicKey === "string" ? createPublicKey(publicKey) : publicKey;
  return createHash("sha256").update(key.export({ type: "spki", format: "der" })).digest("hex");
}

function addAudit(
  audit: RefreshAuditEvent[],
  eventType: RefreshAuditEvent["eventType"],
  outcome: RefreshAuditEvent["outcome"],
  dispatch: RefreshDispatchEnvelope,
  evidenceClass: EvidenceClass,
  summary: string,
  now: Date,
) {
  audit.push({
    eventType,
    outcome,
    requestId: dispatch.requestId,
    targetNodeId: dispatch.targetNodeId,
    operation: REFRESH_SIGNED_STATUS,
    evidenceClass,
    summary,
    occurredAt: now.toISOString(),
  });
}

function failReceipt(
  dispatch: RefreshDispatchEnvelope,
  reason: string,
  now: Date,
  audit: RefreshAuditEvent[],
  nodePublicKeyFingerprint: string,
): RefreshConductorOutput {
  const started = now.toISOString();
  const unsigned: Omit<RefreshReceipt, "receiptHash" | "nodeSignature"> = {
    schema: "ARCHANGEL_REFRESH_SIGNED_STATUS_RECEIPT/v1",
    receiptId: randomUUID(),
    requestId: dispatch.requestId,
    dispatchId: dispatch.dispatchId,
    operation: REFRESH_SIGNED_STATUS,
    targetNodeId: dispatch.targetNodeId,
    success: false,
    result: null,
    failureReason: reason,
    executionStartedAt: started,
    executionCompletedAt: started,
    originalDispatchHash: dispatch.dispatchHash,
    signerIdentity: dispatch.targetNodeId,
    nodePublicKeyFingerprint,
    challengeId: dispatch.challengeId,
  };
  const receiptHash = sha256(canonical(unsigned));
  const receipt: RefreshReceipt = { ...unsigned, receiptHash, nodeSignature: "" };
  addAudit(audit, "conductor.final_decision", "rejected", dispatch, "DERIVED", reason, now);
  return { receipt, audit };
}

export function buildDispatchHash(dispatch: Omit<RefreshDispatchEnvelope, "dispatchHash" | "dispatchSignature">): string {
  return sha256(canonical(dispatch));
}

export function buildPayloadHash(payload: RefreshPayload): string {
  return sha256(canonical(payload));
}

export function signDispatch(
  dispatch: Omit<RefreshDispatchEnvelope, "dispatchHash" | "dispatchSignature">,
  privateKey: KeyObject | string,
): RefreshDispatchEnvelope {
  const dispatchHash = buildDispatchHash(dispatch);
  const dispatchSignature = sign(null, Buffer.from(dispatchHash), typeof privateKey === "string" ? createPrivateKey(privateKey) : privateKey).toString("base64url");
  return { ...dispatch, dispatchHash, dispatchSignature };
}

export async function conductRefreshSignedStatus(input: RefreshConductorInput): Promise<RefreshConductorOutput> {
  const now = input.now ?? new Date();
  const audit: RefreshAuditEvent[] = [];
  const dispatch = input.dispatch;
  const issuedAt = Date.parse(dispatch.issuedAt);
  const expiresAt = Date.parse(dispatch.expiresAt);
  const expectedPayloadHash = buildPayloadHash(dispatch.payload);
  const expectedDispatchHash = buildDispatchHash(unsignedDispatch(dispatch));

  addAudit(audit, "conductor.authorization", "accepted", dispatch, "AUTHORIZED", "Operator authorization context received for the exact operation and target.", now);

  const fail = (reason: string) => failReceipt(dispatch, reason, now, audit, input.nodePublicKeyFingerprint);

  if (dispatch.schema !== REFRESH_SIGNED_STATUS_CONTRACT || dispatch.operation !== REFRESH_SIGNED_STATUS || dispatch.contractVersion !== "1") return fail("Unsupported operation contract.");
  if (dispatch.archangelNodeId !== "ARCHANGEL") return fail("Dispatch signer identity is not ARCHANGEL.");
  if (!dispatch.targetNodeId || dispatch.targetNodeId !== dispatch.targetNodeId.trim()) return fail("Target node identity is invalid.");
  if (dispatch.requiredScope !== REFRESH_SIGNED_STATUS_SCOPE) return fail("Required scope is not read:health.");
  if (dispatch.authorizationContext !== "operator-approved") return fail("Operator authorization context is invalid.");
  if (dispatch.payloadHash !== expectedPayloadHash) return fail("Payload hash mismatch.");
  if (dispatch.dispatchHash !== expectedDispatchHash) return fail("Dispatch hash mismatch.");
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt) || expiresAt <= issuedAt || expiresAt - issuedAt > MAX_WINDOW_MS) return fail("Dispatch validity window is invalid.");
  if (issuedAt > now.getTime() + MAX_CLOCK_SKEW_MS || expiresAt <= now.getTime()) return fail("Dispatch is expired or issued in the future.");

  let dispatchSignatureValid = false;
  try {
    dispatchSignatureValid = verify(
      null,
      Buffer.from(dispatch.dispatchHash),
      typeof input.archangelPublicKey === "string" ? createPublicKey(input.archangelPublicKey) : input.archangelPublicKey,
      Buffer.from(dispatch.dispatchSignature, "base64url"),
    );
  } catch {
    dispatchSignatureValid = false;
  }
  if (!dispatchSignatureValid) return fail("ARCHANGEL dispatch signature verification failed.");

  addAudit(audit, "conductor.dispatch", "accepted", dispatch, "AUTHORIZED", "Canonical dispatch envelope verified; no generic command path is available.", now);

  const signal = input.signal ?? new AbortController().signal;
  let nodeResponse: { result: RefreshExecutionResult; receipt: RefreshReceipt };
  try {
    nodeResponse = await input.nodeAdapter.refreshSignedStatus(dispatch, signal);
  } catch (error) {
    const reason = error instanceof Error && error.name === "AbortError" ? "Node operation timed out." : "Node rejected REFRESH_SIGNED_STATUS preconditions.";
    addAudit(audit, "conductor.execution", reason === "Node operation timed out." ? "timeout" : "rejected", dispatch, "OBSERVED", reason, now);
    return fail(reason);
  }
  addAudit(audit, "conductor.execution", "accepted", dispatch, "OBSERVED", "Node completed the read-only status refresh.", now);

  const receiptVerification = verifyRefreshReceipt(nodeResponse.receipt, dispatch, input.nodePublicKey, now);
  if (!receiptVerification.valid) {
    addAudit(audit, "conductor.receipt", "failed", dispatch, "DERIVED", receiptVerification.reason, now);
    return failReceipt(dispatch, receiptVerification.reason, now, audit, input.nodePublicKeyFingerprint);
  }
  addAudit(audit, "conductor.receipt", "verified", dispatch, "DERIVED", "Node receipt signature and dispatch binding verified.", now);
  addAudit(audit, "conductor.final_decision", "verified", dispatch, "DERIVED", "REFRESH_SIGNED_STATUS accepted with verified read-only evidence.", now);
  return { receipt: nodeResponse.receipt, audit };
}

export function verifyRefreshReceipt(receipt: RefreshReceipt, dispatch: RefreshDispatchEnvelope, nodePublicKey: KeyObject | string, now = new Date()): { valid: true } | { valid: false; reason: string } {
  if (receipt.schema !== "ARCHANGEL_REFRESH_SIGNED_STATUS_RECEIPT/v1") return { valid: false, reason: "Receipt schema mismatch." };
  if (receipt.requestId !== dispatch.requestId || receipt.dispatchId !== dispatch.dispatchId || receipt.operation !== REFRESH_SIGNED_STATUS || receipt.targetNodeId !== dispatch.targetNodeId) return { valid: false, reason: "Receipt does not bind to the dispatch." };
  if (receipt.originalDispatchHash !== dispatch.dispatchHash || receipt.challengeId !== dispatch.challengeId) return { valid: false, reason: "Receipt dispatch binding mismatch." };
  if (Date.parse(receipt.executionCompletedAt) > now.getTime() + MAX_CLOCK_SKEW_MS) return { valid: false, reason: "Receipt is issued in the future." };
  const expectedHash = sha256(canonical(unsignedReceipt(receipt)));
  if (receipt.receiptHash !== expectedHash) return { valid: false, reason: "Receipt hash mismatch." };
  try {
    const valid = verify(null, Buffer.from(receipt.receiptHash), typeof nodePublicKey === "string" ? createPublicKey(nodePublicKey) : nodePublicKey, Buffer.from(receipt.nodeSignature, "base64url"));
    return valid ? { valid: true } : { valid: false, reason: "Node receipt signature verification failed." };
  } catch {
    return { valid: false, reason: "Node receipt key or signature is invalid." };
  }
}

export function createStagingNodeAdapter(nodePrivateKeyPem: string, status: RefreshExecutionResult): RefreshNodeAdapter {
  const nodeKey = createPrivateKey(nodePrivateKeyPem);
  return {
    async refreshSignedStatus(dispatch, signal) {
      if (signal.aborted) throw new DOMException("Aborted", "AbortError");
      if (dispatch.operation !== REFRESH_SIGNED_STATUS) throw new Error("Unsupported operation");
      const executionStartedAt = dispatch.issuedAt;
      const executionCompletedAt = dispatch.issuedAt;
      const unsigned = {
        schema: "ARCHANGEL_REFRESH_SIGNED_STATUS_RECEIPT/v1" as const,
        receiptId: randomUUID(),
        requestId: dispatch.requestId,
        dispatchId: dispatch.dispatchId,
        operation: REFRESH_SIGNED_STATUS,
        targetNodeId: dispatch.targetNodeId,
        success: true,
        result: status,
        failureReason: null,
        executionStartedAt,
        executionCompletedAt,
        originalDispatchHash: dispatch.dispatchHash,
        signerIdentity: dispatch.targetNodeId,
        nodePublicKeyFingerprint: keyFingerprint(createPublicKey(nodeKey)),
        challengeId: dispatch.challengeId,
      };
      const receiptHash = sha256(canonical(unsigned));
      return { result: status, receipt: { ...unsigned, receiptHash, nodeSignature: sign(null, Buffer.from(receiptHash), nodeKey).toString("base64url") } };
    },
  };
}

export function stagingDispatch(targetNodeId: string, operatorKeyReference: string, privateKey: KeyObject | string, now = new Date()): RefreshDispatchEnvelope {
  const issuedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + MAX_WINDOW_MS).toISOString();
  const payload: RefreshPayload = { requestedFields: ["status", "version", "capabilities"], reason: "operator-requested-status-refresh" };
  return signDispatch({
    schema: REFRESH_SIGNED_STATUS_CONTRACT,
    dispatchId: randomUUID(),
    requestId: randomUUID(),
    challengeId: randomUUID(),
    nonce: randomUUID(),
    issuedAt,
    expiresAt,
    archangelNodeId: "ARCHANGEL",
    targetNodeId,
    operation: REFRESH_SIGNED_STATUS,
    contractVersion: "1",
    requiredScope: REFRESH_SIGNED_STATUS_SCOPE,
    operatorKeyReference,
    authorizationContext: "operator-approved",
    payload,
    payloadHash: buildPayloadHash(payload),
  }, privateKey);
}

export function publicFingerprint(publicKey: KeyObject | string): string {
  return keyFingerprint(publicKey);
}
