export const NODE_IDS = [
  "root-gate",
  "tesseract-terminus",
  "xinus-clarity",
  "kether-gate",
  "tesseract-a",
  "keira",
  "project-reclaim",
] as const;

export type NodeId = (typeof NODE_IDS)[number];

export type FleetNodeDefinition = {
  id: NodeId;
  name: string;
  region: string;
  role: string;
  cluster: "Alpha" | "Beta" | "Bridge";
  declaredState: "Declared running" | "Planned deployment";
  fingerprint: string;
};

export const FLEET_NODES: FleetNodeDefinition[] = [
  {
    id: "root-gate",
    name: "Root-Gate",
    region: "Oregon · us-west-2",
    role: "Sovereign identity · authority anchor",
    cluster: "Alpha",
    declaredState: "Declared running",
    fingerprint: "Pending secure enrollment",
  },
  {
    id: "tesseract-terminus",
    name: "Tesseract-Terminus",
    region: "Oregon · us-west-2",
    role: "Provenance, anchoring · sovereign attestation",
    cluster: "Alpha",
    declaredState: "Declared running",
    fingerprint: "Pending secure enrollment",
  },
  {
    id: "xinus-clarity",
    name: "XinUS-Clarity",
    region: "Ireland · eu-west-1",
    role: "Flagship application layer · Clarity Suite",
    cluster: "Alpha",
    declaredState: "Declared running",
    fingerprint: "Pending secure enrollment",
  },
  {
    id: "kether-gate",
    name: "Kether-Gate",
    region: "Singapore · ap-southeast-1",
    role: "Monarch OS · sovereign operating-system layer",
    cluster: "Beta",
    declaredState: "Declared running",
    fingerprint: "Pending secure enrollment",
  },
  {
    id: "tesseract-a",
    name: "Tesseract-A",
    region: "Frankfurt · eu-central-1",
    role: "Tesseract mirror · recovery portal",
    cluster: "Beta",
    declaredState: "Declared running",
    fingerprint: "Pending secure enrollment",
  },
  {
    id: "keira",
    name: "KEIRA",
    region: "São Paulo · sa-east-1",
    role: "Intelligence application · truth analysis layer",
    cluster: "Beta",
    declaredState: "Declared running",
    fingerprint: "Pending secure enrollment",
  },
  {
    id: "project-reclaim",
    name: "Project Reclaim",
    region: "Montreal · ca-central-1 · planned bridge host",
    role: "Field activation · recovery and real-world impact layer",
    cluster: "Bridge",
    declaredState: "Planned deployment",
    fingerprint: "Enrollment not initiated",
  },
];

export const OPERATION_TYPES = [
  "deploy",
  "restart",
  "configuration promote",
  "backup verify",
] as const;

export type OperationType = (typeof OPERATION_TYPES)[number];

export const AUDIT_EVENT_TYPES = [
  "intent.proposed",
  "intent.approved",
  "receipt.recorded",
  "verification.outcome",
] as const;

export type AuditEventType = (typeof AUDIT_EVENT_TYPES)[number];
