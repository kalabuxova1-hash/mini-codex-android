import { boundedBody, callTool, instructions, json, ownerId, tools } from "@/lib/phone-relay";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  let id: string | number | null = null;
  try {
    const body = await boundedBody(request) as {jsonrpc?:string;id?:string|number;method?:string;params?:{protocolVersion?:string;name?:string;arguments?:unknown}};
    if (body?.jsonrpc !== "2.0" || typeof body.method !== "string") return json({jsonrpc:"2.0",id,error:{code:-32600,message:"Invalid MCP request"}},400);
    id = body.id ?? null;
    if (body.id === undefined) return new Response(null,{status:202});
    if (typeof body.id !== "number" && typeof body.id !== "string") return json({jsonrpc:"2.0",id,error:{code:-32600,message:"Invalid request ID"}},400);
    let result: unknown;
    if (body.method === "initialize") result = { protocolVersion: ["2024-11-05","2025-03-26","2025-06-18"].includes(body.params?.protocolVersion || "") ? body.params!.protocolVersion : "2025-03-26", capabilities:{tools:{}},serverInfo:{name:"Codaki Mini Codex Phone",version:"0.2.0"},instructions };
    else if (body.method === "ping") result = {};
    else if (body.method === "tools/list") result = {tools};
    else if (body.method === "tools/call") {
      const owner = await ownerId();
      if (!owner) return json({error:"Authenticated Site owner required"},403);
      result = await callTool(String(body.params?.name || ""),body.params?.arguments || {},owner,body.id);
    } else return json({jsonrpc:"2.0",id,error:{code:-32601,message:"MCP method not found"}});
    return json({jsonrpc:"2.0",id,result});
  } catch (error) {
    // Do not log argument payloads, file contents or credential-bearing URLs.
    const message = error instanceof Error ? error.message : "Phone relay unavailable";
    return json({jsonrpc:"2.0",id,error:{code:-32602,message:message.length < 250 ? message : "Phone relay unavailable"}});
  }
}
export async function GET() { return new Response(null,{status:405,headers:{Allow:"POST"}}); }
