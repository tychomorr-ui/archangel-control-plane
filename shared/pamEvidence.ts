import { z } from "zod";

export const PAM_EVIDENCE_SCHEMA = "NEXINUS_PAM_EVIDENCE_REQUEST/v1" as const;
export const PAM_EVIDENCE_RESPONSE_SCHEMA = "NEXINUS_PAM_EVIDENCE_RESPONSE/v1" as const;

export const pamEvidenceTargetSchema = z.enum(["keira", "valkyrie"]);
export const pamEvidenceOperationSchema = z.enum(["version", "evidence"]);

export const pamEvidenceRequestSchema = z.object({
  schema: z.literal(PAM_EVIDENCE_SCHEMA),
  requestId: z.string().regex(/^pam_[a-zA-Z0-9_-]{8,96}$/),
  target: pamEvidenceTargetSchema,
  operation: pamEvidenceOperationSchema,
  requestedAt: z.string().datetime({ offset: true }),
  purpose: z.string().trim().min(1).max(256),
}).strict();

export type PamEvidenceRequest = z.infer<typeof pamEvidenceRequestSchema>;
export type PamEvidenceTarget = z.infer<typeof pamEvidenceTargetSchema>;
export type PamEvidenceOperation = z.infer<typeof pamEvidenceOperationSchema>;

export const pamEvidenceStateSchema = z.enum(["FETCHED", "UNKNOWN"]);

export const pamEvidenceResponseSchema = z.object({
  schema: z.literal(PAM_EVIDENCE_RESPONSE_SCHEMA),
  requestId: pamEvidenceRequestSchema.shape.requestId,
  target: pamEvidenceTargetSchema,
  operation: pamEvidenceOperationSchema,
  state: pamEvidenceStateSchema,
  authority: z.literal("none"),
  mutatesRemoteState: z.literal(false),
  fetchedAt: z.string().datetime({ offset: true }),
  evidence: z.unknown().optional(),
  reason: z.string().optional(),
}).strict();

export type PamEvidenceResponse = z.infer<typeof pamEvidenceResponseSchema>;

export function unknownPamEvidence(
  request: PamEvidenceRequest,
  reason: string,
  fetchedAt = new Date().toISOString(),
): PamEvidenceResponse {
  return {
    schema: PAM_EVIDENCE_RESPONSE_SCHEMA,
    requestId: request.requestId,
    target: request.target,
    operation: request.operation,
    state: "UNKNOWN",
    authority: "none",
    mutatesRemoteState: false,
    fetchedAt,
    reason,
  };
}
