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
