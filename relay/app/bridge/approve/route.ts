import { getChatGPTUser } from "../../chatgpt-auth";
import { approve } from "@/lib/pc-relay";
import { json } from "@/lib/phone-relay";
export async function POST(request: Request) {
  try {
    if (request.headers.get("origin") !== new URL(request.url).origin) return json({ error: "Same-origin consent required" }, 403);
    if (Number(request.headers.get("content-length") || 0) > 4096) return json({ error: "Request too large" }, 413);
    const user = await getChatGPTUser();
    if (!user) return json({ error: "Sign in required" }, 403);
    if (!request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")) return json({ error: "Form required" }, 400);
    const reader = request.body?.getReader();
    if (!reader) return json({ error: "Form required" }, 400);
    const chunks: Uint8Array[] = []; let size = 0;
    try {
      for (;;) {
        const {done,value} = await reader.read(); if (done) break;
        size += value.length; if (size > 4096) throw new Error("Form too large");
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
    const bytes = new Uint8Array(size); let position = 0;
    for (const chunk of chunks) { bytes.set(chunk,position); position += chunk.length; }
    const data = new URLSearchParams(new TextDecoder().decode(bytes));
    await approve(String(data.get("id") || ""), user, String(data.get("fingerprint") || ""));
    return new Response(null, { status: 303, headers: { "Location": "/bridge?id=" + encodeURIComponent(String(data.get("id"))), "Cache-Control": "no-store" } });
  } catch { return json({ error: "Invitation unavailable or changed; refresh and compare fingerprint" }, 403); }
}
