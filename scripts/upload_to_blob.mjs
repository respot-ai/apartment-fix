#!/usr/bin/env node
/**
 * Upload every photo under scripts/handover_images/page-NNN/*.jpg to Vercel Blob.
 * Writes a manifest at scripts/handover_blob_manifest.json:
 *   { "10": ["https://....jpg", ...], "11": [...], ... }   // page number -> public URLs
 *
 * Reads BLOB_READ_WRITE_TOKEN from .env.local (synced by `vercel env pull`).
 */
import { put } from "@vercel/blob";
import fs from "node:fs";
import path from "node:path";

// Tiny .env.local reader (just BLOB_READ_WRITE_TOKEN).
function loadEnv() {
  const envPath = path.resolve("./.env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv();

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
if (!TOKEN) {
  console.error("BLOB_READ_WRITE_TOKEN missing. Run `vercel env pull .env.local`.");
  process.exit(1);
}

const IMAGES_DIR = path.resolve("./scripts/handover_images");
const MANIFEST_PATH = path.resolve("./scripts/handover_blob_manifest.json");

if (!fs.existsSync(IMAGES_DIR)) {
  console.error(`No images dir at ${IMAGES_DIR}. Run the importer with --render-images first.`);
  process.exit(1);
}

// Resume from a partial manifest if one exists.
const manifest = fs.existsSync(MANIFEST_PATH)
  ? JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"))
  : {};

const pageDirs = fs.readdirSync(IMAGES_DIR)
  .filter((name) => name.startsWith("page-"))
  .sort();

let uploaded = 0, skipped = 0, failed = 0;

for (const dir of pageDirs) {
  const pageNum = String(parseInt(dir.replace("page-", ""), 10));
  const photoFiles = fs.readdirSync(path.join(IMAGES_DIR, dir))
    .filter((f) => /^photo-\d+\.jpg$/i.test(f))
    .sort();
  if (photoFiles.length === 0) continue;

  const existing = manifest[pageNum] ?? [];
  if (existing.length === photoFiles.length) {
    skipped += photoFiles.length;
    continue;
  }

  const urls = [];
  for (const f of photoFiles) {
    const local = path.join(IMAGES_DIR, dir, f);
    const remotePath = `handover/page-${pageNum.padStart(3, "0")}/${f}`;
    try {
      const blob = await put(remotePath, fs.readFileSync(local), {
        access: "public",
        contentType: "image/jpeg",
        token: TOKEN,
        allowOverwrite: true,
      });
      urls.push(blob.url);
      uploaded++;
      process.stdout.write(`  ↑ ${remotePath}\n`);
    } catch (err) {
      failed++;
      console.error(`  ✗ ${remotePath}: ${err.message}`);
    }
  }
  manifest[pageNum] = urls;
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

console.log(`\nDone. uploaded=${uploaded} skipped=${skipped} failed=${failed}`);
console.log(`Manifest: ${MANIFEST_PATH} (${Object.keys(manifest).length} pages)`);
