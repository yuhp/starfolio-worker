import { writeFile } from "node:fs/promises";

const required = [
  "CLOUDFLARE_WORKER_NAME",
  "CLOUDFLARE_KV_NAMESPACE_ID",
];

const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
}

const config = {
  $schema: "./node_modules/wrangler/config-schema.json",
  name: process.env.CLOUDFLARE_WORKER_NAME,
  main: "src/index.ts",
  compatibility_date: "2026-07-31",
  workers_dev: true,
  preview_urls: false,
  kv_namespaces: [{
    binding: "KV_StarHistory",
    id: process.env.CLOUDFLARE_KV_NAMESPACE_ID,
  }],
  triggers: { crons: ["0 * * * *"] },
  observability: { enabled: true, head_sampling_rate: 0.1 },
};

await writeFile("wrangler.jsonc", `${JSON.stringify(config, null, 2)}\n`);
