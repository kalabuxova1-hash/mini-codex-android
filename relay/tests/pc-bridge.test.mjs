import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import ts from "typescript";

async function fixture() {
  const sqlite = new DatabaseSync(":memory:");
  for (const name of ["0000_clear_the_call.sql", "0001_hesitant_raza.sql"]) sqlite.exec(await readFile(new URL("../drizzle/"+name, import.meta.url), "utf8"));
  const db = { prepare(sql) {
    const stmt = sqlite.prepare(sql); let args = [];
    return { bind(...v) { args=v; return this; }, run() { stmt.run(...args); return {}; }, first() { return stmt.get(...args) || null; }, all() { return { results: stmt.all(...args) }; } };
  }, async batch(statements) { sqlite.exec("BEGIN"); try { const r = statements.map(s=>s.run()); sqlite.exec("COMMIT"); return r; } catch(e) { sqlite.exec("ROLLBACK"); throw e; } } };
  const context = { env: { DB: db }, user: { userId: "phone-owner", email: "phone@example.com" }, pinned: "phone-owner", phoneCalls: [] };
  const key = "pc_test_"+randomUUID().replaceAll("-", ""); globalThis[key]=context;
  let source = await readFile(new URL("../lib/pc-relay.ts", import.meta.url), "utf8");
  source = source.replace('import { env } from "cloudflare:workers";', `const ctx = globalThis[${JSON.stringify(key)}]; const env = ctx.env;`)
    .replace('import { getChatGPTUser } from "../app/chatgpt-auth";', 'const getChatGPTUser = async () => ctx.user;')
    .replace('import { ownerId, callTool, now, json, validAgent } from "./phone-relay";', `const ownerId = async () => ctx.user?.userId === ctx.pinned ? ctx.pinned : null;
const callTool = async (...args) => {ctx.phoneCalls.push(args); return {content:[],isError:false};};
const now=()=>Math.floor(Date.now()/1000); const json=(v,s=200)=>Response.json(v,{status:s}); const validAgent=()=>false;`);
  const compiled = ts.transpileModule(source, {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
  const bridge = await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
  const request = token => new Request('https://relay.invalid/bridge/api', {method:'POST', headers:token ? {authorization:'Bearer '+token} : {}});
  const invoke = async (name,args) => JSON.parse((await bridge.callBridge(name,args)).content[0].text);
  async function pair(email="pc@example.com", caps=["terminal"], phone=false) {
    const invite=await invoke("mini_pc_invite",{email,phone_access:phone});
    const token=randomUUID().replaceAll('-','')+randomUUID().replaceAll('-','');
    const draft=await (await bridge.api(request(),{action:'pair',code:invite.code,token,label:'test PC',capabilities:caps})).json();
    context.user={userId:'pc-owner',email};
    await bridge.approve(invite.connection_id,context.user,draft.fingerprint);
    return {id:invite.connection_id,token,invite,draft};
  }
  return {sqlite,context,bridge,request,invoke,pair,close(){sqlite.close();delete globalThis[key];}};
}

test('email is invitation only; wrong owner, fingerprint and reused code rejected',async()=>{
  const f=await fixture();try {
    const invite=await f.invoke('mini_pc_invite',{email:'PC@EXAMPLE.COM'});
    const token='a'.repeat(64);
    const draft=await (await f.bridge.api(f.request(),{action:'pair',code:invite.code,token,label:'PC',capabilities:['terminal']})).json();
    await assert.rejects(f.bridge.approve(invite.connection_id,{userId:'intruder',email:'other@example.com'},draft.fingerprint));
    await assert.rejects(f.bridge.approve(invite.connection_id,{userId:'pc-owner',email:'pc@example.com'},'wrong'));
    await assert.rejects(f.bridge.api(f.request(token),{action:'next'}));
    await assert.rejects(f.bridge.api(f.request(),{action:'pair',code:invite.code,token:'b'.repeat(64),label:'other PC',capabilities:[]}));
    await f.bridge.approve(invite.connection_id,{userId:'pc-owner',email:'pc@example.com'},draft.fingerprint);
    assert.equal((await f.bridge.api(f.request(token),{action:'next'})).status,200);
  } finally {f.close();}
});

test('PC-only queue is claimed once, idempotent, isolated and revocable',async()=>{
  const f=await fixture();try {
    const link=await f.pair(); await f.bridge.api(f.request(link.token),{action:'next'});
    f.context.user={userId:'phone-owner',email:'phone@example.com'};
    const args={connection_id:link.id,tool:'pc_terminal',arguments:{command:'Get-Date'},request_id:'r1'};
    const first=await f.invoke('mini_pc_call',args); const retry=await f.invoke('mini_pc_call',args);
    assert.equal(first.job_id,retry.job_id);
    await assert.rejects(f.invoke('mini_pc_call',{...args,arguments:{command:'different'}}));
    const polls=await Promise.all([f.bridge.api(f.request(link.token),{action:'next'}),f.bridge.api(f.request(link.token),{action:'next'})]);
    const jobs=await Promise.all(polls.map(p=>p.json()));assert.equal(jobs.filter(j=>j.job).length,1);
    await f.bridge.api(f.request(link.token),{action:'result',job_id:first.job_id,status:'completed',result:{output:'ok'}});
    assert.equal((await f.invoke('mini_pc_result',{connection_id:link.id,job_id:first.job_id})).output,'ok');
    f.context.user={userId:'stranger',email:'stranger@example.com'};
    await assert.rejects(f.invoke('mini_pc_result',{connection_id:link.id,job_id:first.job_id}));
    await assert.rejects(f.bridge.api(f.request('f'.repeat(64)),{action:'result',job_id:first.job_id,status:'completed',result:{}}));
    f.context.user={userId:'pc-owner',email:'pc@example.com'};
    await f.invoke('mini_disconnect',{connection_id:link.id});
    await assert.rejects(f.bridge.api(f.request(link.token),{action:'next'}));
  } finally {f.close();}
});

test('reverse phone access is separately granted, scoped and denied by default',async()=>{
  const f=await fixture();try {
    const link=await f.pair('pc@example.com',[],false);
    await assert.rejects(f.bridge.api(f.request(link.token),{action:'phone_call',tool:'phone_status',arguments:{},request_id:'r1'}));
    await f.bridge.api(f.request(link.token),{action:'next'});
    await assert.rejects(f.invoke('mini_pc_call',{connection_id:link.id,tool:'pc_terminal',arguments:{},request_id:'r2'}));
    f.context.user={userId:'phone-owner',email:'phone@example.com'};
    const allowed=await f.pair('pc@example.com',[],true);
    await f.bridge.api(f.request(allowed.token),{action:'phone_call',tool:'phone_status',arguments:{},request_id:'r1'});
    assert.equal(f.context.phoneCalls[0][2],'pc-link:'+allowed.id);
  } finally {f.close();}
});

test('expired invitations/jobs do not execute; offline commands are not queued',async()=>{
  const f=await fixture();try {
    const link=await f.pair();
    await assert.rejects(f.invoke('mini_pc_call',{connection_id:link.id,tool:'pc_status',arguments:{},request_id:'offline'}));
    await f.bridge.api(f.request(link.token),{action:'next'});
    const job=await f.invoke('mini_pc_call',{connection_id:link.id,tool:'pc_status',arguments:{},request_id:'expires'});
    f.sqlite.prepare('UPDATE pc_jobs SET expires_at=0 WHERE id=?').run(job.job_id);
    const response=await (await f.bridge.api(f.request(link.token),{action:'next'})).json();assert.equal(response.job,null);
    assert.equal((await f.invoke('mini_pc_result',{connection_id:link.id,job_id:job.job_id})).status,'uncertain');
  } finally {f.close();}
});

test('no fixed connection-count limit and no legacy phone owner replacement',async()=>{
  const f=await fixture();try {
    for(let i=0;i<30;i++) await f.invoke('mini_pc_invite',{email:`pc${i}@example.com`});
    assert.equal((await f.invoke('mini_connections',{})).length,30);
    f.context.user={userId:'other',email:'other@example.com'};
    await assert.rejects(f.invoke('mini_pc_invite',{email:'pc@example.com'}));
    assert.equal(f.context.pinned,'phone-owner');
  } finally {f.close();}
});
