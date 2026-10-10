// One private owner/device slot and a bounded command/result queue.
import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

export const phoneAgents = sqliteTable("phone_agents", {
  id: text("id").primaryKey(),
  owner: text("owner"),
  lastSeen: integer("last_seen").notNull().default(0),
});
export const phoneJobs = sqliteTable("phone_jobs", {
  id: text("id").primaryKey(),
  requestKey: text("request_key").notNull().unique(),
  owner: text("owner").notNull(),
  tool: text("tool").notNull(),
  arguments: text("arguments").notNull(),
  state: text("state").notNull().default("queued"),
  createdAt: integer("created_at").notNull(),
  expiresAt: integer("expires_at").notNull(),
});
export const phoneResultChunks = sqliteTable("phone_result_chunks", {
  jobId: text("job_id").notNull().references(() => phoneJobs.id, { onDelete: "cascade" }),
  part: integer("part").notNull(),
  content: text("content").notNull(),
}, t => [primaryKey({ columns: [t.jobId, t.part] })]);

export const pcLinks = sqliteTable("pc_links", {
  id: text("id").primaryKey(), inviter: text("inviter").notNull(), email: text("email").notNull(),
  codeHash: text("code_hash").unique(), expiresAt: integer("expires_at").notNull(), owner: text("owner"),
  tokenHash: text("token_hash").unique(), label: text("label").notNull().default(""),
  capabilities: text("capabilities").notNull().default("[]"), phoneAccess: integer("phone_access").notNull().default(0),
  state: text("state").notNull().default("invited"), lastSeen: integer("last_seen").notNull().default(0),
});
export const pcJobs = sqliteTable("pc_jobs", {
  id: text("id").primaryKey(), linkId: text("link_id").notNull().references(() => pcLinks.id),
  requestKey: text("request_key").notNull().unique(), tool: text("tool").notNull(), arguments: text("arguments").notNull(),
  state: text("state").notNull().default("queued"), createdAt: integer("created_at").notNull(),
  expiresAt: integer("expires_at").notNull(), result: text("result"),
});
