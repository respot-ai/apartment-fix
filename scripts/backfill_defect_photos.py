#!/usr/bin/env python3
"""
Backfill the 52 already-imported defects with Vercel Blob photo URLs.

Reads the manifest produced by upload_to_blob.mjs, matches each defect by
its protocolRef ("page N") to the corresponding URL list, and PATCHes the
defect to set photoBefore (first URL) and photos (the full list).

Usage:
    python3 scripts/backfill_defect_photos.py [--api https://handover-psi.vercel.app]
"""
from __future__ import annotations
import argparse, json, re, sys, urllib.request
from pathlib import Path

MANIFEST = Path(__file__).resolve().parent / "handover_blob_manifest.json"

def patch(api_base: str, defect_id: str, body: dict) -> dict:
    req = urllib.request.Request(
        f"{api_base.rstrip('/')}/api/defects/{defect_id}",
        data=json.dumps(body).encode("utf-8"),
        headers={"content-type": "application/json"},
        method="PATCH",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--api", default="https://handover-psi.vercel.app")
    args = p.parse_args(argv)

    if not MANIFEST.exists():
        sys.exit(f"manifest not found: {MANIFEST}. Run upload_to_blob.mjs first.")
    manifest: dict[str, list[str]] = json.loads(MANIFEST.read_text())

    with urllib.request.urlopen(f"{args.api}/api/defects", timeout=30) as r:
        defects = json.loads(r.read().decode("utf-8"))

    page_re = re.compile(r"page\s+(\d+)")
    updated = skipped = failed = 0
    for d in defects:
        m = page_re.search(d.get("protocolRef") or "")
        if not m:
            skipped += 1
            continue
        page = str(int(m.group(1)))
        urls = manifest.get(page) or []
        if not urls:
            skipped += 1
            continue
        if d.get("photoBefore") == urls[0] and d.get("photos") == urls:
            skipped += 1
            continue
        try:
            patch(args.api, d["id"], {"photoBefore": urls[0], "photos": urls})
            updated += 1
            print(f"  ✓ page {page:>2}: {len(urls)} photo(s) → {d['id'][:8]}… {d['title'][:50]}")
        except Exception as e:
            failed += 1
            print(f"  ✗ page {page}: {e}", file=sys.stderr)

    print(f"\nDone. updated={updated} skipped={skipped} failed={failed}")
    return 0 if failed == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
