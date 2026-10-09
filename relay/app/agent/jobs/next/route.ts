import { json, nextJob, validAgent } from "@/lib/phone-relay";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!validAgent(request)) return json({error:"Agent authentication required"},401);
  try { return await nextJob(); } catch { return json({error:"Phone queue temporarily unavailable"},503); }
}
