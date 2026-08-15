export const NODE_IDS = [
  "root-gate",
  "tesseract-terminus",
  "xinus-clarity",
  "kether-gate",
  "tesseract-a",
  "keira",
  "project-reclaim",
  "iwa-sage",
  "resonate-earth",
  "exitus-lens",
] as const;

export type NodeId = (typeof NODE_IDS)[number];

export type FleetNodeDefinition = {
  id: NodeId;
  name: string;
  region: string;
  role: string;
  cluster: "Alpha" | "Beta" | "Bridge" | "Outer";
  declaredState: "Declared running" | "Planned deployment";
  fingerprint: string;
};

export const FLEET_NODES: FleetNodeDefinition[] = [
  {
    id: "root-gate",
    name: "Root-Gate",
    region: "N. Virginia · us-east-1 · ROOT_SOVEREIGN-IDENTITY",
    role: "Sovereign identity · authority anchor",
    cluster: "Alpha",
    declaredState: "Declared running",
    fingerprint: "Pending secure enrollment",
  },
  {
    id: "tesseract-terminus",
    name: "Tesseract-Terminus",
    region: "Spain · eu-south-2 · Sovereign Provenance Console",
    role: "Sovereign Provenance Console · provenance, anchoring · sovereign attestation",
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
    name: "Monarch-OS",
    region: "Singapore · ap-southeast-1 · Debian",
    role: "Kether-Gate logical role · sovereign operating-system layer",
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
    region: "Oregon · us-west-2 · Lake & Mendocino field node",
    role: "Field activation · recovery and real-world impact layer",
    cluster: "Bridge",
    declaredState: "Declared running",
    fingerprint: "Pending secure enrollment",
  },
  {
    id: "iwa-sage",
    name: "IWA Sage",
    region: "Canada Central · ca-central-1 · Montreal · IWA-SAGE-APP",
    role: "Indigenous Wellness Alliance · community wellness and service layer",
    cluster: "Outer",
    declaredState: "Declared running",
    fingerprint: "Pending secure enrollment",
  },
  {
    id: "resonate-earth",
    name: "Resonate Earth",
    region: "Physical host not declared · public front-door application",
    role: "Earth resonance public front door · placement pending verified host inventory",
    cluster: "Outer",
    declaredState: "Planned deployment",
    fingerprint: "Enrollment not initiated",
  },
  {
    id: "exitus-lens",
    name: "Exitus Lens",
    region: "Physical host not declared · planned application concept",
    role: "Read-only visual evidence layer · placement pending host creation",
    cluster: "Outer",
    declaredState: "Planned deployment",
    fingerprint: "Enrollment not initiated",
  },
];

/**
 * Rendered relationship topology. This is deliberately separate from the
 * geographic map: its vertex order expresses trust roles, not distance.
 */
export const TOPOLOGY_LAYOUT_CONTRACT = {
  vertices: [
    { id: "xinus-clarity", tone: "alpha", position: "alpha-apex" },
    { id: "root-gate", tone: "alpha", position: "alpha-root" },
    { id: "tesseract-terminus", tone: "alpha", position: "alpha-terminus" },
    { id: "kether-gate", tone: "beta", position: "beta-kether" },
    { id: "tesseract-a", tone: "beta", position: "beta-tesseract-a" },
    { id: "keira", tone: "beta", position: "beta-keira" },
    { id: "project-reclaim", tone: "bridge", position: "bridge-reclaim" },
  ],
  outerCircle: [
    { id: "iwa-sage", placement: "north-american-community" },
    { id: "resonate-earth", placement: "unplaced-public-front-door" },
    { id: "exitus-lens", placement: "unplaced-evidence-layer" },
  ],
  spacing: {
    mobileMinCanvasHeightPx: 900,
    desktopMinCanvasHeightPx: 940,
    betaKeiraTopPercent: 76,
    bridgeBottomPercent: 1,
  },
} as const;

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
