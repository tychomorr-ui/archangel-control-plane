import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const operatorCredentials = mysqlTable("operator_credentials", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 128 }).notNull().unique(),
  passwordHash: text("passwordHash").notNull(),
  sessionVersion: int("sessionVersion").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const operatorPasskeys = mysqlTable("operator_passkeys", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 128 }).notNull(),
  credentialId: varchar("credentialId", { length: 512 }).notNull().unique(),
  publicKey: text("publicKey").notNull(),
  counter: int("counter").default(0).notNull(),
  transports: text("transports"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
});

export const operatorWebauthnChallenges = mysqlTable("operator_webauthn_challenges", {
  id: int("id").autoincrement().primaryKey(),
  challenge: varchar("challenge", { length: 512 }).notNull().unique(),
  username: varchar("username", { length: 128 }).notNull(),
  purpose: mysqlEnum("purpose", ["registration", "authentication"]).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const meshNodes = mysqlTable("mesh_nodes", {
  id: int("id").autoincrement().primaryKey(),
  nodeId: varchar("nodeId", { length: 64 }).notNull().unique(),
  displayName: varchar("displayName", { length: 128 }).notNull(),
  region: varchar("region", { length: 128 }).notNull(),
  role: varchar("role", { length: 256 }).notNull(),
  cluster: mysqlEnum("cluster", ["Alpha", "Beta", "Bridge", "Outer"]).notNull(),
  publicKeyFingerprint: varchar("publicKeyFingerprint", { length: 256 }).notNull(),
  enrollmentStatus: mysqlEnum("enrollmentStatus", ["pending", "enrolled", "revoked"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const nodeStatusReports = mysqlTable("node_status_reports", {
  id: int("id").autoincrement().primaryKey(),
  nodeId: varchar("nodeId", { length: 64 }).notNull(),
  observedAt: timestamp("observedAt").notNull(),
  version: varchar("version", { length: 128 }).notNull(),
  uptimeClass: varchar("uptimeClass", { length: 128 }).notNull(),
  applicationReadiness: mysqlEnum("applicationReadiness", ["ready", "degraded", "not_ready", "unknown"]).notNull(),
  reachability: mysqlEnum("reachability", ["reachable", "unreachable", "unknown"]).notNull(),
  verificationState: mysqlEnum("verificationState", ["verified", "failed", "pending"]).notNull(),
  narrative: text("narrative").notNull(),
  signedReceiptHash: varchar("signedReceiptHash", { length: 256 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const applicationIntegrations = mysqlTable("application_integrations", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: varchar("applicationId", { length: 64 }).notNull().unique(),
  nodeId: varchar("nodeId", { length: 64 }).notNull().unique(),
  endpointUrl: varchar("endpointUrl", { length: 512 }).notNull(),
  publicKeyPem: text("publicKeyPem").notNull(),
  scopes: text("scopes").notNull(),
  status: mysqlEnum("status", ["pending", "active", "revoked"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const atmosAuthorityChallenges = mysqlTable("atmos_authority_challenges", {
  id: int("id").autoincrement().primaryKey(),
  challengeId: varchar("challengeId", { length: 64 }).notNull().unique(),
  nonce: varchar("nonce", { length: 256 }).notNull(),
  issuedAt: timestamp("issuedAt").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const atmosNodeReceiptChallenges = mysqlTable("atmos_node_receipt_challenges", {
  id: int("id").autoincrement().primaryKey(),
  challengeId: varchar("challengeId", { length: 64 }).notNull().unique(),
  nodeId: varchar("nodeId", { length: 64 }).notNull(),
  nonce: varchar("nonce", { length: 256 }).notNull(),
  issuedAt: timestamp("issuedAt").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const tesseractAWitnessChallenges = mysqlTable("tesseract_a_witness_challenges", {
  id: int("id").autoincrement().primaryKey(),
  challengeId: varchar("challengeId", { length: 64 }).notNull().unique(),
  nonce: varchar("nonce", { length: 256 }).notNull(),
  issuedAt: timestamp("issuedAt").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const tesseractAWitnessReceipts = mysqlTable("tesseract_a_witness_receipts", {
  id: int("id").autoincrement().primaryKey(),
  receiptHash: varchar("receiptHash", { length: 256 }).notNull().unique(),
  challengeId: varchar("challengeId", { length: 64 }).notNull(),
  witnessNodeId: varchar("witnessNodeId", { length: 64 }).notNull(),
  observationSetHash: varchar("observationSetHash", { length: 256 }).notNull(),
  observationCount: int("observationCount").notNull(),
  receiptJson: text("receiptJson").notNull(),
  verifiedAt: timestamp("verifiedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const atmosAuthorityMutations = mysqlTable("atmos_authority_mutations", {
  id: int("id").autoincrement().primaryKey(),
  mutationId: varchar("mutationId", { length: 64 }).notNull().unique(),
  challengeId: varchar("challengeId", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const atmosControlPlaneState = mysqlTable("atmos_control_plane_state", {
  id: int("id").autoincrement().primaryKey(),
  stateKey: varchar("stateKey", { length: 64 }).notNull().unique(),
  mode: mysqlEnum("mode", ["ready", "maintenance"]).notNull().default("ready"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const intents = mysqlTable("intents", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("publicId", { length: 64 }).notNull().unique(),
  nodeId: varchar("nodeId", { length: 64 }).notNull(),
  operationType: mysqlEnum("operationType", ["deploy", "restart", "configuration promote", "backup verify"]).notNull(),
  scope: text("scope").notNull(),
  risk: mysqlEnum("risk", ["low", "moderate", "high", "critical"]).notNull(),
  rollbackMethod: text("rollbackMethod").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  state: mysqlEnum("state", ["draft", "proposed", "approved", "rejected", "expired", "executed", "verified"]).default("proposed").notNull(),
  createdBy: varchar("createdBy", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const auditEvents = mysqlTable("audit_events", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("publicId", { length: 64 }).notNull().unique(),
  intentPublicId: varchar("intentPublicId", { length: 64 }),
  nodeId: varchar("nodeId", { length: 64 }),
  eventType: varchar("eventType", { length: 128 }).notNull(),
  outcome: mysqlEnum("outcome", ["accepted", "rejected", "pending", "verified", "failed"]).notNull(),
  actorPseudonym: varchar("actorPseudonym", { length: 128 }).notNull(),
  summary: text("summary").notNull(),
  occurredAt: timestamp("occurredAt").notNull(),
});

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("publicId", { length: 64 }).notNull().unique(),
  nodeId: varchar("nodeId", { length: 64 }),
  kind: mysqlEnum("kind", ["node_unreachable", "verification_failed", "intent_expired", "health_beat_missed"]).notNull(),
  severity: mysqlEnum("severity", ["info", "warning", "critical"]).notNull(),
  message: text("message").notNull(),
  detectedAt: timestamp("detectedAt").notNull(),
  acknowledgedAt: timestamp("acknowledgedAt"),
});

export const planningScenarios = mysqlTable("planning_scenarios", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("publicId", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 160 }).notNull(),
  objective: text("objective").notNull(),
  assumptions: text("assumptions").notNull(),
  affectedApplicationIds: text("affectedApplicationIds").notNull(),
  posture: mysqlEnum("posture", ["draft", "review-ready", "archived"]).default("draft").notNull(),
  risk: mysqlEnum("risk", ["low", "moderate", "high", "critical"]).notNull(),
  rollbackHypothesis: text("rollbackHypothesis").notNull(),
  createdBy: varchar("createdBy", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
