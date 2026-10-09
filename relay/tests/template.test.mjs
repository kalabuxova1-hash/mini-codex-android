import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const skipped = new Set(["node_modules", "dist", ".git", ".next", ".vinext", ".wrangler", ".sites-runtime"]);

async function* sourceFiles(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (skipped.has(entry.name) || entry.isSymbolicLink()) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) yield* sourceFiles(path);
    else if (entry.isFile()) yield path;
  }
}

test("public manifest contains only generic bindings and the MCP capability", async () => {
  const manifest = JSON.parse(await readFile(join(root, ".openai", "hosting.json"), "utf8"));
  assert.deepEqual(manifest, { d1: "DB", r2: null, capabilities: ["mcp"] });
  assert.equal(Object.hasOwn(manifest, "project_id"), false);
});

test("the example secret is blank and private/runtime files are ignored", async () => {
  const example = await readFile(join(root, ".env.example"), "utf8");
  assert.match(example, /^PHONE_AGENT_TOKEN=\s*$/m);
  const ignore = await readFile(join(root, ".gitignore"), "utf8");
  for (const name of ["/node_modules/", "/dist/", "/.sites-runtime/", "config.json", "*-config.json", ".env*", ".dev.vars*"]) {
    assert.ok(ignore.split(/\r?\n/).includes(name), `${name} must be ignored`);
  }
});

test("source contains no private device/profile or hosted instance configuration", async () => {
  for await (const path of sourceFiles(root)) {
    if (path === fileURLToPath(import.meta.url)) continue;
    const text = (await readFile(path, "utf8")).toLowerCase();
    const name = relative(root, path);
    assert.ok(!/[a-z]:[\\/]+users[\\/]+[^\s"'<>]+/i.test(text), `${name}: private Windows profile path`);
    assert.ok(!/"(?:serial|device_id)"\s*:\s*"[^"\s]+"/.test(text), `${name}: hardcoded device identity`);
    assert.ok(!/https?:\/\/[^\s"'<>]*(?:\.chatgpt\.site|\.oai\.site|\.sites\.openai\.com)(?:[\/\s"'<>]|$)/i.test(text), `${name}: personal hosted URL`);
    assert.ok(!/"project_id"\s*:\s*"[^"\s]+"/.test(text), `${name}: populated Site ID`);
    assert.ok(!/PHONE_AGENT_TOKEN\s*=\s*["']?[a-f0-9]{40,}/i.test(text), `${name}: embedded phone token`);
  }
});
