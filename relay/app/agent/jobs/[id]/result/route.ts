import { boundedBody, json, saveResult, validAgent } from "@/lib/phone-relay";
export const dynamic = "force-dynamic";
export async function POST(request: Request, context: {params:Promise<{id:string}>}) {
  if (!validAgent(request)) return json({error:"Agent authentication required"},401);
  try {
    const {id} = await context.params;
    if (!/^[a-f0-9-]{36}$/.test(id)) return json({error:"Invalid job ID"},400);
    return await saveResult(id,await boundedBody(request));
  } catch { return json({error:"Could not save bounded phone result"},400); }
}
