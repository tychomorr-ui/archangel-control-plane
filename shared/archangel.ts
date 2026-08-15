export const NODE_IDS = [
  "root-gate",
  "tesseract-terminus",
  "xinus-clarity",
  "kether-gate",
  "tesseract-a",
  "the-portal",
] as const;

export type NodeId = (typeof NODE_IDS)[number];

export type FleetNodeDefinition = {
  id: NodeId;
  name: string;
  region: string;
  role: string;
  cluster: "Alpha" | "Beta";
  declaredState: "Declared running";
  fingerprint: string;
};

export const FLEET_NODES: FleetNodeDefinition[] = [
  {
    id: "root-gate",
    name: "Root-Gate",
    region: "Oregon · us-west-2",
    role: "Alpha anchor · control plane",
    cluster: "Alpha",
    declaredState: "Declared running",
    fingerprint: "Pending secure enrollment",
  },
  {
    id: "tesseract-terminus",
    name: "Tesseract-Terminus",
    region: "Oregon · us-west-2",
    role: "Alpha vertex · application terminus",
    cluster: "Alpha",
    declaredState: "Declared running",
    fingerprint: "Pending secure enrollment",
  },
  {
    id: "xinus-clarity",
    name: "XinUS-Clarity",
    region: "Ireland · eu-west-1",
    role: "Alpha vertex · European compute",
    cluster: "Alpha",
    declaredState: "Declared running",
    fingerprint: "Pending secure enrollment",
  },
  {
    id: "kether-gate",
    name: "Kether-Gate",
    region: "Singapore · ap-southeast-1",
    role: "Beta anchor · APAC gateway",
    cluster: "Beta",
    declaredState: "Declared running",
    fingerprint: "Pending secure enrollment",
  },
  {
    id: "tesseract-a",
    name: "Tesseract-A",
    region: "Frankfurt · eu-central-1",
    role: "Beta vertex · signing surface",
    cluster: "Beta",
    declaredState: "Declared running",
    fingerprint: "Pending secure enrollment",
  },
  {
    id: "the-portal",
    name: "The_Portal",
    region: "São Paulo · sa-east-1",
    role: "Beta vertex · recovery witness",
    cluster: "Beta",
    declaredState: "Declared running",
    fingerprint: "Pending secure enrollment",
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
