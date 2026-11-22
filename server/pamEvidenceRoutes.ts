import type { Express, Request } from "express";
import {
  pamEvidenceRequestSchema,
  type PamEvidenceRequest,
  type PamEvidenceTarget,
  unknownPamEvidence,
  PAM_EVIDENCE_RESPONSE_SCHEMA,
} from "../shared/pamEvidence";

const REQUEST_TIMEOUT_MS = 3_000;

export type PamEvidenceRouteDependencies = {
  isAllowedCaller?: (request: Request) => boolean;
  fetchEvidence?: (target: PamEvidenceTarget, request: PamEvidenceRequest) => Promise<unknown>;
};

function normalizeIp(value: string | undefined): string {
  if (!value) return "";
  return value.replace(/^::ffff:/, "");
}

function isPrivateIpv4(hostname: string): boolean {
  const octets = hostname.split(".").map(Number);
  if (octets.length !== 4 || octets.some(octet => !Number.isInteger(octet) || octet < 0 || octet > 255)) return false;
  return octets[0] === 10
    || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
    || (octets[0] === 192 && octets[1] === 168);
}

function configuredEndpoint(target: PamEvidenceTarget): URL | undefined {
  const raw = target === "keira" ? process.env.PAM_KEIRA_EVIDENCE_URL : process.env.PAM_VALKYRIE_EVIDENCE_URL;
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    if (url.hostname !== "localhost" && url.hostname !== "127.0.0.1" && url.hostname !== "::1" && !isPrivateIpv4(url.hostname)) return undefined;
    return url;
  } catch {
    return undefined;
  }
}

function defaultCallerPolicy(request: Request): boolean {
  const expected = normalizeIp(process.env.PAM_CONSOLE_UTILITY_IP);
  const actual = normalizeIp(request.ip || request.socket.remoteAddress);
  return Boolean(expected && actual && expected === actual);
}

async function defaultFetchEvidence(target: PamEvidenceTarget, request: PamEvidenceRequest): Promise<unknown> {
  const endpoint = configuredEndpoint(target);
  if (!endpoint) throw new Error("private_endpoint_not_configured");
  endpoint.searchParams.set("operation", request.operation);
  endpoint.searchParams.set("requestId", request.requestId);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        accept: "application/json",
        "x-pam-request-id": request.requestId,
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`remote_http_${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export function registerPamEvidenceRoutes(app: Express, dependencies: PamEvidenceRouteDependencies = {}) {
  const isAllowedCaller = dependencies.isAllowedCaller ?? defaultCallerPolicy;
  const fetchEvidence = dependencies.fetchEvidence ?? defaultFetchEvidence;

  app.post("/v1/pam/evidence", async (req, res) => {
    const parsed = pamEvidenceRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        schema: PAM_EVIDENCE_RESPONSE_SCHEMA,
        error: "invalid_request",
        message: "Expected the strict read-only PAM evidence request contract.",
      });
    }

    if (!isAllowedCaller(req)) {
      return res.status(403).json(unknownPamEvidence(parsed.data, "caller_not_allowlisted"));
    }

    try {
      const evidence = await fetchEvidence(parsed.data.target, parsed.data);
      return res.status(200).json({
        schema: PAM_EVIDENCE_RESPONSE_SCHEMA,
        requestId: parsed.data.requestId,
        target: parsed.data.target,
        operation: parsed.data.operation,
        state: "FETCHED",
        authority: "none",
        mutatesRemoteState: false,
        fetchedAt: new Date().toISOString(),
        evidence,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "remote_evidence_unavailable";
      return res.status(200).json(unknownPamEvidence(parsed.data, reason));
    }
  });
}
