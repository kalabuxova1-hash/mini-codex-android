import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../app/chatgpt-auth";
import { ownerId, callTool, now, json, validAgent } from "./phone-relay";

type Link = { id: string; inviter: string; email: string; owner: string | null; token_hash: string | null; label: string; capabilities: string; phone_access: number; state: string; expires_at: number; last_seen: number };
type Job = { id: string; link_id: string; tool: string; arguments: string; state: string; expires_at: number; result: string | null };
const db = () => (env as unknown as { DB: D1Database }).DB;
export const capabilities = ["terminal", "files_read", "files_write", "codex"];
export const pcOperations: Record<string, string | null> = { pc_status: null, pc_terminal: "terminal", pc_read_file: "files_read", pc_write_file: "files_write", pc_list_files: "files_read", pc_codex: "codex" };
const result = (value: unknown) => ({ content: [{ type: "text", text: JSON.stringify(value) }], isError: false });
const object = (properties: Record<string, unknown>, required: string[]) => ({ type: "object", properties, required, additionalProperties: false });
const str = { type: "string", minLength: 1, maxLength: 200 };
export const bridgeTools = [
  { name: "mini_pc_invite", description: "Invite a PC by its owner's ChatGPT email. Does not grant access until that owner signs in and approves the PC fingerprint. Can invite yourself for PC-only use. Deliver the code yourself; no email is sent.", inputSchema: object({ email: str, phone_access: { type: "boolean", description: "Explicitly allow this PC to request phone commands. Default false." } }, ["email"]) },
  { name: "mini_connections", description: "List saved Mini Codex PC links, permissions and online status.", inputSchema: object({}, []) },
  { name: "mini_pc_call", description: "Queue an authorized operation on a paired PC. Start with pc_status. Supported operations: pc_terminal(command,cwd,timeout_seconds); pc_read_file(path); pc_write_file(path,text); pc_list_files(path); pc_codex(prompt,cwd,timeout_seconds). Use a stable request_id, and poll mini_pc_result. Never repeat uncertain commands. Computer Use and Sites are separate client plugins; call their actual tools only on the intended host.", inputSchema: object({ connection_id: str, tool: { type: "string", enum: Object.keys(pcOperations) }, arguments: { type: "object" }, request_id: str }, ["connection_id", "tool", "arguments", "request_id"]) },
  { name: "mini_pc_result", description: "Retrieve a queued PC job without repeating its command.", inputSchema: object({ connection_id: str, job_id: str }, ["connection_id", "job_id"]) },
  { name: "mini_disconnect", description: "Revoke a saved connection in both directions. Unclaimed jobs are cancelled immediately.", inputSchema: object({ connection_id: str }, ["connection_id"]) },
  { name: "mini_phone_call", description: "Request a phone tool from a paired PC owner's ChatGPT account, only if the phone owner explicitly enabled this direction. Phone is optional. Keep the request_id to avoid replay; use phone_job_result for pending results.", inputSchema: object({ connection_id: str, tool: str, arguments: { type: "object" }, request_id: str }, ["connection_id", "tool", "arguments", "request_id"]) },
].map(t => ({ ...t, annotations: { readOnlyHint: ["mini_connections", "mini_pc_result"].includes(t.name), destructiveHint: !["mini_connections", "mini_pc_result"].includes(t.name) } }));

export async function hash(value: string): Promise<string> {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))), b => b.toString(16).padStart(2, "0")).join("");
}
function text(value: unknown, max = 200): string {
  if (typeof value !== "string" || !value.length || value.length > max || /[\r\n\x00]/.test(value)) throw new Error("Invalid string argument");
  return value;
}
export function email(value: unknown): string {
  const v = text(value, 254).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) throw new Error("Valid email required");
  return v;
}
export async function maintain() {
  await db().batch([
    db().prepare("UPDATE pc_links SET state='expired',code_hash=NULL,token_hash=NULL WHERE state IN ('invited','pending') AND expires_at < ?").bind(now()),
    db().prepare("UPDATE pc_jobs SET state='uncertain' WHERE state IN ('queued','running') AND expires_at < ?").bind(now()),
    db().prepare("DELETE FROM pc_jobs WHERE created_at < ?").bind(now() - 86400),
    db().prepare("DELETE FROM pc_links WHERE state IN ('expired','revoked') AND expires_at < ? AND id NOT IN (SELECT link_id FROM pc_jobs)").bind(now() - 86400),
  ]);
}
export async function linkFor(id: string, user: string): Promise<Link> {
  const row = await db().prepare("SELECT * FROM pc_links WHERE id=? AND (inviter=? OR owner=?) AND state='active'").bind(id, user, user).first<Link>();
  if (!row) throw new Error("Connection unavailable or not permitted");
  return row;
}
export async function revoke(id: string) {
  await db().batch([
    db().prepare("UPDATE pc_links SET state='revoked',token_hash=NULL,code_hash=NULL,expires_at=? WHERE id=?").bind(now(), id),
    db().prepare("UPDATE pc_jobs SET state='cancelled' WHERE link_id=? AND state='queued'").bind(id),
  ]);
}
function publicLink(row: Link) {
  return { connection_id: row.id, email: row.email, label: row.label, capabilities: JSON.parse(row.capabilities), phone_access: !!row.phone_access, status: row.state, online: row.state === "active" && row.last_seen > now() - 20, last_seen: row.last_seen || null };
}
export async function list(user: string) {
  const rows = await db().prepare("SELECT * FROM pc_links WHERE (inviter=? OR owner=?) AND state IN ('invited','pending','active') ORDER BY label,id").bind(user, user).all<Link>();
  return rows.results.map(publicLink);
}
export async function jobResult(link: Link, id: string) {
  const job = await db().prepare("SELECT * FROM pc_jobs WHERE link_id=? AND id=?").bind(link.id, id).first<Job>();
  if (!job) throw new Error("Job not found or expired; inspect PC state before retrying");
  if (job.result) return { ...JSON.parse(job.result), job_id: job.id, status: job.state };
  return { job_id: job.id, status: job.state, expires_at: job.expires_at, instruction: "Poll this job ID. Never resubmit a command with an uncertain outcome." };
}
export async function enqueue(link: Link, args: Record<string, unknown>) {
  const tool = text(args.tool); const key = text(args.request_id);
  if (!Object.hasOwn(pcOperations, tool)) throw new Error("Unknown PC operation");
  const cap = pcOperations[tool];
  if (cap && !JSON.parse(link.capabilities).includes(cap)) throw new Error("PC owner did not grant this capability");
  if (!args.arguments || typeof args.arguments !== "object" || Array.isArray(args.arguments)) throw new Error("Arguments object required");
  const raw = JSON.stringify(args.arguments);
  if (new TextEncoder().encode(raw).length > 128000) throw new Error("Arguments too large");
  // Idempotency is scoped to the link; changed payload with the same ID is rejected.
  const requestKey = await hash(JSON.stringify([link.id, key]));
  const old = await db().prepare("SELECT * FROM pc_jobs WHERE request_key=?").bind(requestKey).first<Job>();
  if (old) {
    if (old.tool !== tool || old.arguments !== raw) throw new Error("request_id reused with a different command");
    return jobResult(link, old.id);
  }
  if (link.last_seen < now() - 20) throw new Error("PC is offline; no job queued");
  const count = await db().prepare("SELECT COUNT(*) AS n FROM pc_jobs WHERE link_id=? AND state IN ('queued','running')").bind(link.id).first<{ n: number }>();
  if ((count?.n || 0) >= 8) throw new Error("PC queue full");
  const id = crypto.randomUUID();
  await db().prepare("INSERT OR IGNORE INTO pc_jobs(id,link_id,request_key,tool,arguments,created_at,expires_at) VALUES(?,?,?,?,?,?,?)").bind(id, link.id, requestKey, tool, raw, now(), now() + 120).run();
  const saved = await db().prepare("SELECT * FROM pc_jobs WHERE request_key=?").bind(requestKey).first<Job>();
  if (!saved || saved.tool !== tool || saved.arguments !== raw) throw new Error("request_id conflict");
  return jobResult(link, saved.id);
}
async function phoneCall(link: Link, args: Record<string, unknown>) {
  if (!link.phone_access) throw new Error("Phone owner did not grant reverse access");
  return callTool(text(args.tool), args.arguments || {}, "pc-link:" + link.id, text(args.request_id));
}
export async function callBridge(name: string, args: Record<string, unknown>) {
  await maintain();
  const user = await getChatGPTUser();
  if (!user) throw new Error("Authenticated ChatGPT account required");
  if (name === "mini_connections") return result(await list(user.userId));
  if (name === "mini_pc_invite") {
    // Owner-private hosting + existing owner pin remains the invitation authority.
    if (!await ownerId()) throw new Error("Relay owner required to invite a PC");
    const recipient = email(args.email);
    if (args.phone_access !== undefined && typeof args.phone_access !== "boolean") throw new Error("phone_access must be boolean");
    const code = crypto.randomUUID() + crypto.randomUUID(); const id = crypto.randomUUID();
    await db().prepare("INSERT INTO pc_links(id,inviter,email,code_hash,expires_at,phone_access) VALUES(?,?,?,?,?,?)").bind(id, user.userId, recipient, await hash(code), now() + 600, args.phone_access === true ? 1 : 0).run();
    return result({ connection_id: id, code, expires_at: now() + 600, email: recipient, instruction: "On the intended PC run pair, then sign in on /bridge?id=" + id + ". Compare the fingerprint and approve. Deliver the code privately; no email was sent. Hosting must permit this recipient to sign in; email does not bypass Site access." });
  }
  const link = await linkFor(text(args.connection_id), user.userId);
  if (name === "mini_disconnect") { await revoke(link.id); return result({ revoked: true }); }
  if (name === "mini_pc_call") return result(await enqueue(link, args));
  if (name === "mini_pc_result") return result(await jobResult(link, text(args.job_id)));
  if (name === "mini_phone_call" && user.userId === link.owner) return phoneCall(link, args);
  throw new Error("Unknown or unauthorized bridge tool");
}
export async function pendingLink(id: string, recipientEmail: string): Promise<Link | null> {
  await maintain();
  return db().prepare("SELECT * FROM pc_links WHERE id=? AND email=? AND state='pending'").bind(id, email(recipientEmail)).first<Link>();
}
export async function approve(id: string, user: { userId: string; email: string }, fingerprint: string) {
  const pending = await pendingLink(id, user.email);
  if (!pending || !pending.token_hash || pending.token_hash !== fingerprint) throw new Error("Pairing expired or fingerprint changed");
  await db().prepare("UPDATE pc_links SET owner=?,state='active',code_hash=NULL WHERE id=? AND email=? AND state='pending' AND token_hash=? AND expires_at>=?").bind(user.userId, id, email(user.email), fingerprint, now()).run();
}
async function device(request: Request): Promise<Link> {
  const token = request.headers.get("authorization")?.replace(/^Bearer /i, "") || "";
  if (!/^[a-f0-9]{64}$/.test(token)) throw new Error("Device authentication required");
  const row = await db().prepare("SELECT * FROM pc_links WHERE token_hash=? AND state IN ('pending','active')").bind(await hash(token)).first<Link>();
  if (!row) throw new Error("Device revoked or unknown");
  return row;
}
export async function api(request: Request, args: Record<string, unknown>): Promise<Response> {
  await maintain();
  if (args.action === "pair") {
    const code = text(args.code); const token = text(args.token);
    if (!/^[a-f0-9]{64}$/.test(token)) throw new Error("Strong device credential required");
    const requested = args.capabilities;
    if (!Array.isArray(requested) || requested.some(c => !capabilities.includes(c)) || requested.length > 4) throw new Error("Invalid capabilities");
    const row = await db().prepare("UPDATE pc_links SET state='pending',token_hash=?,label=?,capabilities=? WHERE code_hash=? AND state='invited' AND expires_at>=? RETURNING *").bind(await hash(token), text(args.label, 80), JSON.stringify([...new Set(requested)]), await hash(code), now()).first<Link>();
    if (!row) throw new Error("Invitation invalid, expired or already claimed");
    return json({ connection_id: row.id, email: row.email, fingerprint: row.token_hash, expires_at: row.expires_at });
  }
  if (args.action === "from_phone") {
    if (!validAgent(request)) throw new Error("Phone authentication required");
    const owner = await db().prepare("SELECT owner FROM phone_agents WHERE id='phone'").first<{ owner: string }>();
    if (!owner?.owner) throw new Error("Phone owner not bound");
    if (args.operation === "list") return json(await list(owner.owner));
    const link = await linkFor(text(args.connection_id), owner.owner);
    if (args.operation === "call") return json(await enqueue(link, args));
    if (args.operation === "result") return json(await jobResult(link, text(args.job_id)));
    throw new Error("Unknown phone bridge operation");
  }
  const link = await device(request);
  if (args.action === "pair_status") return json({ ...publicLink(link), owner: link.owner, inviter: link.inviter });
  if (link.state !== "active") throw new Error("Owner has not approved pairing");
  if (args.action === "revoke") { await revoke(link.id); return json({ revoked: true }); }
  if (args.action === "phone_call") return json(await phoneCall(link, args));
  if (args.action === "next") {
    await db().prepare("UPDATE pc_links SET last_seen=? WHERE id=? AND state='active'").bind(now(), link.id).run();
    const job = await db().prepare("UPDATE pc_jobs SET state='running' WHERE id=(SELECT id FROM pc_jobs WHERE link_id=? AND state='queued' AND expires_at>=? ORDER BY created_at,id LIMIT 1) AND state='queued' AND EXISTS(SELECT 1 FROM pc_links WHERE id=? AND state='active') RETURNING *").bind(link.id, now(), link.id).first<Job>();
    return json({ job: job ? { id: job.id, tool: job.tool, arguments: JSON.parse(job.arguments), expires_at: job.expires_at } : null, capabilities: JSON.parse(link.capabilities) });
  }
  if (args.action === "result") {
    const id = text(args.job_id); const state = args.status;
    if (!["completed", "uncertain"].includes(String(state))) throw new Error("Invalid job state");
    const raw = JSON.stringify(args.result);
    if (!args.result || typeof args.result !== "object" || new TextEncoder().encode(raw).length > 128000) throw new Error("Invalid or oversized result");
    const row = await db().prepare("SELECT * FROM pc_jobs WHERE id=? AND link_id=?").bind(id, link.id).first<Job>();
    if (!row) return json({ error: "Job expired; cached execution must not be repeated" }, 410);
    if (!row.result && !["running", "uncertain"].includes(row.state)) return json({ error: "Job not claimed or was cancelled" }, 409);
    if (!row.result && ["running", "uncertain"].includes(row.state)) await db().prepare("UPDATE pc_jobs SET state=?,result=? WHERE id=? AND link_id=? AND result IS NULL AND state IN ('running','uncertain')").bind(state, raw, id, link.id).run();
    return json({ ok: true });
  }
  throw new Error("Unknown bridge operation");
}
