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
  "valkyrie-adjudication-entity",
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
  {
    id: "valkyrie-adjudication-entity",
    name: "VALKYRIE Adjudication Entity",
    region: "Sovereign host · valkyrie.nexinus.net",
    role: "Adjudication and evidence decision layer",
    cluster: "Outer",
    declaredState: "Declared running",
    fingerprint: "Pending secure enrollment",
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
    { id: "valkyrie-adjudication-entity", placement: "sovereign-adjudication-layer" },
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

export const APPLICATION_IDS = [
  "root-identity",
  "sovereign-provenance-console",
  "xinus-clarity-suite",
  "monarch-os",
  "tesseract-a",
  "keira-intelligence",
  "project-reclaim",
  "iwa-sage",
  "resonate-earth",
  "exitus-lens",
  "valkyrie-adjudication-entity",
] as const;

export type ApplicationId = (typeof APPLICATION_IDS)[number];

export type ApplicationAtlasRecord = {
  id: ApplicationId;
  name: string;
  shortName: string;
  role: string;
  category: "identity" | "provenance" | "application" | "operating-system" | "recovery" | "intelligence" | "field" | "community" | "public-front-door" | "evidence";
  lifecycle: "declared" | "planned";
  publicFrontDoor: string | null;
  hostPosture: string;
  evidencePosture: "evidence-needed" | "declared";
  nodeId: NodeId | null;
  dependencies: ApplicationId[];
  planningNote: string;
};

export const APPLICATION_ATLAS: ApplicationAtlasRecord[] = [
  { id: "root-identity", name: "Root-Gate", shortName: "Identity", role: "Sovereign identity and authority anchor", category: "identity", lifecycle: "declared", publicFrontDoor: null, hostPosture: "Declared N. Virginia host", evidencePosture: "evidence-needed", nodeId: "root-gate", dependencies: [], planningNote: "Root authority remains a planning and authorization concept until signed enrollment is deliberately enabled later." },
  { id: "sovereign-provenance-console", name: "Sovereign Provenance Console", shortName: "Provenance", role: "Provenance, anchoring, hashing, and sovereign attestation", category: "provenance", lifecycle: "declared", publicFrontDoor: "universaltruth.live", hostPosture: "Declared Spain host", evidencePosture: "evidence-needed", nodeId: "tesseract-terminus", dependencies: ["root-identity"], planningNote: "Public front door and provenance role are declared; runtime health remains unobserved." },
  { id: "xinus-clarity-suite", name: "XinUS-Clarity", shortName: "Clarity", role: "Flagship reflective-intelligence application suite", category: "application", lifecycle: "declared", publicFrontDoor: null, hostPosture: "Declared Ireland host", evidencePosture: "evidence-needed", nodeId: "xinus-clarity", dependencies: ["root-identity"], planningNote: "Application portfolio remains cataloged as a declared role, not a live service graph." },
  { id: "monarch-os", name: "Monarch-OS", shortName: "Monarch", role: "Debian-inspired sovereign operating-system program", category: "operating-system", lifecycle: "declared", publicFrontDoor: null, hostPosture: "Declared Singapore Debian host", evidencePosture: "evidence-needed", nodeId: "kether-gate", dependencies: ["root-identity"], planningNote: "Kether-Gate is the logical role; Monarch-OS is the public application and host-facing name." },
  { id: "tesseract-a", name: "Tesseract-A", shortName: "Tesseract A", role: "Recovery portal and Tesseract mirror", category: "recovery", lifecycle: "declared", publicFrontDoor: "nexonis.net", hostPosture: "Declared Frankfurt host", evidencePosture: "evidence-needed", nodeId: "tesseract-a", dependencies: ["root-identity", "sovereign-provenance-console"], planningNote: "Recovery posture is declared; no backup or service verification has been received." },
  { id: "keira-intelligence", name: "KEIRA", shortName: "KEIRA", role: "Intelligence application and truth-analysis layer", category: "intelligence", lifecycle: "declared", publicFrontDoor: null, hostPosture: "Declared São Paulo host", evidencePosture: "evidence-needed", nodeId: "keira", dependencies: ["root-identity", "sovereign-provenance-console"], planningNote: "Intelligence role is modeled without an external model, service, or telemetry claim." },
  { id: "project-reclaim", name: "Project Reclaim", shortName: "Reclaim", role: "Lake and Mendocino field-program bridge", category: "field", lifecycle: "declared", publicFrontDoor: null, hostPosture: "Declared Oregon host", evidencePosture: "evidence-needed", nodeId: "project-reclaim", dependencies: ["root-identity", "keira-intelligence"], planningNote: "Field-program role is distinct from any asserted real-world outcome or device telemetry." },
  { id: "iwa-sage", name: "IWA Sage", shortName: "IWA Sage", role: "Indigenous Wellness Alliance community and wellness application", category: "community", lifecycle: "declared", publicFrontDoor: null, hostPosture: "Declared Montreal host", evidencePosture: "evidence-needed", nodeId: "iwa-sage", dependencies: ["root-identity", "xinus-clarity-suite"], planningNote: "Community-service role is cataloged independently from any user data or service utilization claim." },
  { id: "resonate-earth", name: "Resonate Earth", shortName: "Resonate", role: "Earth resonance public-front-door application", category: "public-front-door", lifecycle: "planned", publicFrontDoor: "resonateearth.live", hostPosture: "Physical host unplaced", evidencePosture: "declared", nodeId: "resonate-earth", dependencies: ["sovereign-provenance-console", "keira-intelligence"], planningNote: "The public front door is declared; any future physical placement remains an explicit scenario, not a map fact." },
  { id: "exitus-lens", name: "Exitus Lens", shortName: "Exitus", role: "Read-only visual-evidence application concept", category: "evidence", lifecycle: "planned", publicFrontDoor: null, hostPosture: "Physical host unplaced", evidencePosture: "declared", nodeId: "exitus-lens", dependencies: ["sovereign-provenance-console", "keira-intelligence"], planningNote: "The evidence lens remains a planned product concept and is intentionally kept off the physical map." },
  { id: "valkyrie-adjudication-entity", name: "VALKYRIE Adjudication Entity", shortName: "VALKYRIE", role: "Adjudication and evidence decision layer", category: "evidence", lifecycle: "declared", publicFrontDoor: "https://valkyrie.nexinus.net", hostPosture: "Declared canonical-domain application", evidencePosture: "evidence-needed", nodeId: "valkyrie-adjudication-entity", dependencies: ["sovereign-provenance-console", "keira-intelligence"], planningNote: "The canonical Valkyrie domain and adjudication role are declared; signed runtime evidence remains pending until the application publishes the expected identity and health artifacts." },
];

export const PLANNING_POLICIES = [
  { id: "policy.host-evidence", title: "Host truth before placement", severity: "blocking" as const, description: "A scenario cannot represent a planned application as a current physical host until an explicit host and region are declared." },
  { id: "policy.no-execution", title: "Application-only boundary", severity: "blocking" as const, description: "Scenarios, policies, and briefs cannot enroll nodes, alter firewall state, start a mesh, or dispatch a command." },
  { id: "policy.rollback", title: "Recovery hypothesis required", severity: "review" as const, description: "A scenario that changes a declared dependency or host posture requires a written rollback hypothesis before promotion to later review." },
  { id: "policy.evidence", title: "Evidence gap remains visible", severity: "advisory" as const, description: "Declared and planned application records remain distinct from observed or verified service evidence." },
] as const;
