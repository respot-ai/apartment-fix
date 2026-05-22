#!/usr/bin/env python3
"""
Import open defects from a handover protocol PDF into the Handover app.

Usage:
    # Render images, generate the preview JSON (no API calls):
    python scripts/import_handover.py path/to/handover.pdf \\
        --emit-json scripts/handover_preview.json \\
        --render-images scripts/handover_images

    # Actually create defects via the API (after reviewing the preview):
    python scripts/import_handover.py path/to/handover.pdf \\
        --api https://handover-psi.vercel.app

The PDF is expected to follow the Israeli handover-protocol layout, where each
page documents one inspected item with:
    - a top-of-page room/area name
    - a status word: לא תקין / תוקן / תקין / לא רלוונטי
    - a category like "מתקני חשמל-08" / "עבודות צביעה-11"
    - an inspected item line (e.g. "חשמל + שקעים + מתגים")
    - a "הערות אודות הליקוי" notes block describing the defect

Only items marked "לא תקין" (not OK) are imported — those are the open defects.

Requires `pdftotext` and `pdftoppm` (poppler-utils) on PATH:
    brew install poppler   # macOS
    apt-get install poppler-utils   # Linux
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import urllib.request
from collections import Counter
from datetime import date
from pathlib import Path

OPEN_STATUS = "לא תקין"
ALL_STATUSES = ("לא רלוונטי", "לא תקין", "תוקן", "תקין")

ROOM_HINTS = (
    "חדר שינה הורים", "חדר רחצה הורים", "חדר שינה מתבגר", "חדר רחצה כללי",
    "מרפסת שירות", "מטבח ופינת אוכל", "סלון", "שירותי אורחים", "מרפסת שמש",
    "מסדרון", 'ממ"ד', "ממד", "מחסן", "מבואת כניסה", "חדר שינה",
    "פיתוח", "מטבח", "אמבטיה", "גג", "גינה", "חדר ילדים", "כניסה", "שירותים",
)

# Trade categories in the protocol look like "מתקני חשמל08-" or "נגרות חרש20 -".
# The trailing "NN-" / "NN -" / "-NN" is a protocol section code, not part of the
# trade name — strip it before using the value as the trade.
CATEGORY_CODE_RE = re.compile(r"\s*\d+\s*-\s*$")

# Hebrew month names, in order, for parsing the cover-page date
# (e.g. "13 מאי 2026 (יום רביעי) | 15:20").
HEBREW_MONTHS = {
    "ינואר": 1, "פברואר": 2, "מרץ": 3, "מרס": 3, "אפריל": 4,
    "מאי": 5, "יוני": 6, "יולי": 7, "אוגוסט": 8,
    "ספטמבר": 9, "אוקטובר": 10, "נובמבר": 11, "דצמבר": 12,
}
DATE_RE = re.compile(
    r"(\d{1,2})\s*("
    + "|".join(HEBREW_MONTHS)
    + r")\s*\(?\s*(\d{4})"
)
INSPECTOR_NOTE_RE = re.compile(r"^\s*:\s*(.+)$")  # trailing " : שם(תפקיד)" lines

DEFAULT_PRIORITY = "medium"
DEFAULT_OWNER = "contractor"
DEFAULT_STATUS_API = "new"
INSPECTOR_AUTHOR = "בקר איכות"
INSPECTOR_INITIALS = "בא"


def extract_protocol_date(text: str) -> str | None:
    """Pull '13 מאי 2026' from the cover page and return an ISO date string."""
    m = DATE_RE.search(text)
    if not m:
        return None
    day, month_name, year = m.group(1), m.group(2), m.group(3)
    return f"{int(year):04d}-{HEBREW_MONTHS[month_name]:02d}-{int(day):02d}"


def extract_text(pdf: Path) -> str:
    try:
        out = subprocess.run(
            ["pdftotext", "-layout", str(pdf), "-"],
            check=True, capture_output=True, text=True,
        )
    except FileNotFoundError:
        sys.exit("pdftotext not found. Install poppler-utils (e.g. `brew install poppler`).")
    except subprocess.CalledProcessError as e:
        sys.exit(f"pdftotext failed: {e.stderr}")
    return re.sub(r"[‪-‮‎‏⁦-⁩]", "", out.stdout)


def parse(text: str) -> list[dict]:
    pages = re.split(r"מופעל ע\"י:\s*\d+/\d+", text)
    records: list[dict] = []

    for page_idx, raw in enumerate(pages, start=1):
        block = raw.strip()
        if not block or "פרטי דיירים" in block:
            continue

        lines = [ln.strip() for ln in block.splitlines() if ln.strip()]
        lines = [ln for ln in lines
                 if ln not in ("חתימת נציג החברה", "חתימת הדיירים")]
        if not lines:
            continue

        room = next((ln for ln in lines if any(h in ln for h in ROOM_HINTS)), None)

        i = 0
        while i < len(lines):
            line = lines[i]
            status = next((s for s in ALL_STATUSES if line.startswith(s)), None)
            if not status:
                i += 1
                continue

            rest = line[len(status):].strip()
            category = rest or None
            item = note = repair = inspector = None

            j = i + 1
            while j < len(lines):
                cur = lines[j]
                if any(cur.startswith(s) for s in ALL_STATUSES):
                    break
                if cur in ("תיעוד", "צילום התיקון") or cur.startswith("תאריך הצילום"):
                    j += 1
                    continue
                if "הערות אודות הליקוי" in cur:
                    j += 1
                    if j < len(lines) and not any(lines[j].startswith(s) for s in ALL_STATUSES):
                        note = lines[j]
                        j += 1
                    continue
                if "הערות אודות התיקון" in cur:
                    j += 1
                    if j < len(lines) and not any(lines[j].startswith(s) for s in ALL_STATUSES):
                        repair = lines[j]
                        j += 1
                    continue
                m = INSPECTOR_NOTE_RE.match(cur)
                if m and item is not None:
                    inspector = m.group(1).strip()
                    j += 1
                    continue
                if item is None:
                    item = cur
                j += 1

            records.append({
                "page": page_idx,
                "room": _clean(room),
                "status": status,
                "category": _clean(category),
                "item": _clean(item),
                "note": _clean(note),
                "repair_note": _clean(repair),
                "inspector": _clean(inspector),
            })
            i = j

    return records


def _clean(s: str | None) -> str | None:
    if not s:
        return s
    s = s.replace("  +", " + ").replace(" +", " + ").replace("  ", " ")
    return s.strip()


def map_to_defect(rec: dict, reported_at: str,
                  image_paths: list[str],
                  known_rooms: set[str], known_trades: set[str]) -> tuple[dict, list[dict], dict]:
    """Return (defect_body, comments, mapping_meta).

    Room and trade values come from the PDF verbatim (with the trade's trailing
    protocol-code stripped). Anything new will be created in the DB before
    defects are posted — see `ensure_lookups` in main().
    """
    trade = CATEGORY_CODE_RE.sub("", rec["category"] or "").strip()
    room = (rec["room"] or "").strip()

    note = rec["note"] or ""
    item = rec["item"] or ""

    # Title: a short, human-readable summary. Prefer the inspector's note,
    # fall back to the inspected item, then the category.
    title_source = note or item or trade
    title = title_source.strip()
    if len(title) > 80:
        title = title[:77].rstrip() + "…"

    # Description: the longer context — what was inspected, what was found.
    description_parts = []
    if item:
        description_parts.append(item)
    if note and note != title:
        description_parts.append(note)
    if trade and trade not in description_parts:
        description_parts.append(trade)
    description = " · ".join(description_parts) or note or item

    body = {
        "title": title,
        "room": room,
        "location": "",
        "trade": trade,
        "priority": DEFAULT_PRIORITY,
        "owner": DEFAULT_OWNER,
        "status": DEFAULT_STATUS_API,
        "dueDate": "",
        "reportedAt": reported_at,
        "description": description,
        "protocolRef": f"page {rec['page']}",
        "photoBefore": image_paths[0] if image_paths else "",
        "photos": image_paths,
    }

    comments = []
    if rec["inspector"]:
        comments.append({
            "who": rec["inspector"],
            "initials": _initials(rec["inspector"]),
            "text": note or item or trade,
        })

    meta = {
        "room_known": room in known_rooms,
        "trade_known": trade in known_trades,
        "raw_room": rec["room"] or "",
        "raw_category": rec["category"] or "",
    }
    return body, comments, meta


def _initials(name: str) -> str:
    name = re.sub(r"\(.*?\)", "", name).strip()
    parts = [p for p in name.split() if p]
    if not parts:
        return "בא"
    if len(parts) == 1:
        return parts[0][:2]
    return parts[0][:1] + parts[1][:1]


def fetch_lookup(api_base: str, path: str) -> set[str]:
    try:
        with urllib.request.urlopen(f"{api_base.rstrip('/')}{path}", timeout=10) as r:
            data = json.loads(r.read().decode("utf-8"))
        return {x["name"] for x in data}
    except Exception as e:
        print(f"warning: could not fetch {path} from {api_base}: {e}", file=sys.stderr)
        return set()


_BOILERPLATE_OBJ_IDS = {"4493", "4494", "4495"}  # logos that repeat on every page
_MIN_IMAGE_BYTES = 8_000  # skip icons / tiny decorations
_MIN_IMAGE_DIM = 100      # px on either side


def _image_index(pdf: Path) -> dict[int, list[dict]]:
    """Return {page_num: [{idx, obj_id, width, height, ...}, ...]} for non-mask images."""
    try:
        out = subprocess.run(
            ["pdfimages", "-list", str(pdf)],
            check=True, capture_output=True, text=True,
        )
    except FileNotFoundError:
        return {}
    by_page: dict[int, list[dict]] = {}
    for line in out.stdout.splitlines()[2:]:
        parts = line.split()
        if len(parts) < 14 or parts[2] != "image":
            continue
        try:
            page = int(parts[0])
            idx = int(parts[1])
            width = int(parts[3])
            height = int(parts[4])
            obj_id = parts[10]
        except (ValueError, IndexError):
            continue
        if obj_id in _BOILERPLATE_OBJ_IDS:
            continue
        if max(width, height) < _MIN_IMAGE_DIM:
            continue
        by_page.setdefault(page, []).append({
            "idx": idx, "obj_id": obj_id,
            "width": width, "height": height,
        })
    return by_page


def extract_page_images(pdf: Path, page: int, out_dir: Path,
                        index: dict[int, list[dict]]) -> list[Path]:
    """Extract real defect photos from a single page (no logos / boilerplate)."""
    keep = index.get(page, [])
    if not keep:
        return []

    out_dir.mkdir(parents=True, exist_ok=True)
    page_dir = out_dir / f"page-{page:03d}"
    page_dir.mkdir(exist_ok=True)
    prefix = page_dir / "raw"

    try:
        subprocess.run(
            ["pdfimages", "-all", "-f", str(page), "-l", str(page),
             str(pdf), str(prefix)],
            check=True, capture_output=True, text=True,
        )
    except (FileNotFoundError, subprocess.CalledProcessError) as e:
        msg = e.stderr if hasattr(e, "stderr") else str(e)
        print(f"pdfimages failed for page {page}: {msg}", file=sys.stderr)
        return []

    keep_indices = {img["idx"] for img in keep}
    out_paths: list[Path] = []
    # pdfimages numbers each extraction starting at 0 *within the page*,
    # but the list-index is global. Walk the raw files in order; the order
    # matches the listing, so we can zip them with the page's image rows.
    page_rows = [row for row in _all_image_rows(pdf) if row["page"] == page]
    raw_files = sorted(page_dir.glob("raw-*"))

    for row, raw in zip(page_rows, raw_files):
        if row["type"] != "image":
            raw.unlink(missing_ok=True)
            continue
        if row["idx"] not in keep_indices:
            raw.unlink(missing_ok=True)
            continue
        if raw.stat().st_size < _MIN_IMAGE_BYTES:
            raw.unlink(missing_ok=True)
            continue
        jpg = page_dir / f"photo-{len(out_paths)+1:02d}.jpg"
        if raw.suffix.lower() in (".jpg", ".jpeg"):
            raw.rename(jpg)
        else:
            # Convert to JPEG with macOS sips (built-in) for compactness.
            try:
                subprocess.run(
                    ["sips", "-s", "format", "jpeg", "-s", "formatOptions", "70",
                     str(raw), "--out", str(jpg)],
                    check=True, capture_output=True, text=True,
                )
                raw.unlink(missing_ok=True)
            except (FileNotFoundError, subprocess.CalledProcessError):
                # Keep original if conversion fails.
                jpg = raw.rename(page_dir / (jpg.stem + raw.suffix))
        out_paths.append(jpg)

    # Sweep any leftovers (smasks etc.)
    for leftover in page_dir.glob("raw-*"):
        leftover.unlink(missing_ok=True)

    return out_paths


def _all_image_rows(pdf: Path) -> list[dict]:
    """Cached full pdfimages -list output as structured rows."""
    if not hasattr(_all_image_rows, "_cache"):
        try:
            out = subprocess.run(
                ["pdfimages", "-list", str(pdf)],
                check=True, capture_output=True, text=True,
            ).stdout
        except (FileNotFoundError, subprocess.CalledProcessError):
            _all_image_rows._cache = []  # type: ignore[attr-defined]
            return []
        rows = []
        for line in out.splitlines()[2:]:
            parts = line.split()
            if len(parts) < 11:
                continue
            try:
                rows.append({
                    "page": int(parts[0]),
                    "idx": int(parts[1]),
                    "type": parts[2],
                    "obj_id": parts[10],
                })
            except ValueError:
                continue
        _all_image_rows._cache = rows  # type: ignore[attr-defined]
    return _all_image_rows._cache  # type: ignore[attr-defined]


def post_lookup(api_base: str, path: str, name: str) -> dict:
    req = urllib.request.Request(
        f"{api_base.rstrip('/')}{path}",
        data=json.dumps({"name": name}).encode("utf-8"),
        headers={"content-type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))


def ensure_lookups(api_base: str, missing_rooms: list[str], missing_trades: list[str]) -> None:
    """Create any rooms/trades that don't yet exist in the DB."""
    for name in missing_rooms:
        try:
            post_lookup(api_base, "/api/rooms", name)
            print(f"  + created room: {name}")
        except Exception as e:
            print(f"  ! failed to create room {name!r}: {e}", file=sys.stderr)
    for name in missing_trades:
        try:
            post_lookup(api_base, "/api/trades", name)
            print(f"  + created trade: {name}")
        except Exception as e:
            print(f"  ! failed to create trade {name!r}: {e}", file=sys.stderr)


def post_defect(api_base: str, body: dict) -> dict:
    req = urllib.request.Request(
        f"{api_base.rstrip('/')}/api/defects",
        data=json.dumps(body).encode("utf-8"),
        headers={"content-type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def post_comment(api_base: str, defect_id: str, comment: dict) -> None:
    req = urllib.request.Request(
        f"{api_base.rstrip('/')}/api/defects/{defect_id}/comments",
        data=json.dumps(comment).encode("utf-8"),
        headers={"content-type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        resp.read()


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    p.add_argument("pdf", type=Path)
    p.add_argument("--api", default="https://handover-psi.vercel.app")
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--include-fixed", action="store_true",
                   help="Also include 'תוקן' (already-fixed) items, marked as status=fixed")
    p.add_argument("--emit-json", type=Path,
                   help="Write the mapped defects as JSON and exit (no API call)")
    p.add_argument("--render-images", type=Path,
                   help="Render each defect's source page to a JPEG in this directory")
    args = p.parse_args(argv)

    if not args.pdf.exists():
        sys.exit(f"file not found: {args.pdf}")

    text = extract_text(args.pdf)
    records = parse(text)

    reported_at = extract_protocol_date(text)
    if reported_at:
        print(f"protocol date: {reported_at}")
    else:
        reported_at = date.today().isoformat()
        print(f"warning: no protocol date found in PDF; falling back to today ({reported_at})", file=sys.stderr)

    selected = []
    for r in records:
        if r["status"] == OPEN_STATUS:
            selected.append((r, "new"))
        elif args.include_fixed and r["status"] == "תוקן":
            selected.append((r, "fixed"))

    known_rooms = fetch_lookup(args.api, "/api/rooms")
    known_trades = fetch_lookup(args.api, "/api/trades")

    bodies: list[tuple[dict, dict, list[dict], dict]] = []  # (source, defect, comments, meta)

    image_index = _image_index(args.pdf) if args.render_images else {}

    for r, api_status in selected:
        image_paths: list[str] = []
        if args.render_images:
            imgs = extract_page_images(args.pdf, r["page"], args.render_images, image_index)
            for img in imgs:
                # Store path relative to the JSON file when emitting JSON, so
                # the static preview can resolve it; absolute otherwise.
                rel = img.relative_to(args.render_images.parent) if args.emit_json else img
                image_paths.append(str(rel))
        body, comments, meta = map_to_defect(r, reported_at, image_paths, known_rooms, known_trades)
        body["status"] = api_status
        bodies.append((r, body, comments, meta))

    # Surface what's missing from the lookups
    new_rooms = sorted({b["room"] for _, b, _, m in bodies if not m["room_known"]})
    new_trades = sorted({b["trade"] for _, b, _, m in bodies if not m["trade_known"]})

    if args.emit_json:
        payload = {
            "summary": {
                "parsed": len(records),
                "eligible": len(selected),
                "by_room": dict(Counter(b["room"] for _, b, _, _ in bodies)),
                "by_trade": dict(Counter(b["trade"] for _, b, _, _ in bodies)),
            },
            "lookups": {
                "known_rooms": sorted(known_rooms),
                "known_trades": sorted(known_trades),
                "missing_rooms": new_rooms,
                "missing_trades": new_trades,
            },
            "defects": [
                {
                    "source": {
                        "page": r["page"],
                        "room": r["room"],
                        "status": r["status"],
                        "category": r["category"],
                        "item": r["item"],
                        "note": r["note"],
                        "inspector": r["inspector"],
                    },
                    "defect": b,
                    "comments": cs,
                    "mapping": m,
                }
                for r, b, cs, m in bodies
            ],
        }
        args.emit_json.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"wrote {len(bodies)} defects → {args.emit_json}")
        if new_rooms:
            print(f"  new rooms that need adding to /api/rooms: {new_rooms}")
        if new_trades:
            print(f"  new trades that need adding to /api/trades: {new_trades}")
        return 0

    print(f"Parsed {len(records)} protocol entries; {len(selected)} eligible.\n")
    for idx, (r, body, cs, meta) in enumerate(bodies, 1):
        room_tag = "✓" if meta["room_known"] else "NEW"
        trade_tag = "✓" if meta["trade_known"] else "NEW"
        print(f"[{idx:2}] page {r['page']:>2} | {r['status']} → {body['status']}")
        print(f"     title:       {body['title']}")
        print(f"     description: {body['description']}")
        print(f"     room  ({room_tag}): {meta['raw_room']!r} → {body['room']}")
        print(f"     trade ({trade_tag}): {meta['raw_category']!r} → {body['trade']}")
        if cs:
            for c in cs:
                print(f"     comment:     [{c['who']}] {c['text']}")
        print()

    print("--- summary ---")
    print(f"by room:  {dict(Counter(b['room'] for _, b, _, _ in bodies))}")
    print(f"by trade: {dict(Counter(b['trade'] for _, b, _, _ in bodies))}")
    if new_rooms:
        print(f"\nNEW rooms (must be added to /api/rooms): {new_rooms}")
    if new_trades:
        print(f"NEW trades (must be added to /api/trades): {new_trades}")

    if args.dry_run:
        print("\ndry-run: no defects created.")
        return 0

    prompt = f"\nCreate {len(bodies)} defects at {args.api}"
    if new_rooms or new_trades:
        prompt += f" (first creating {len(new_rooms)} rooms, {len(new_trades)} trades)"
    confirm = input(prompt + "? [y/N] ").strip().lower()
    if confirm != "y":
        print("aborted.")
        return 1

    if new_rooms or new_trades:
        print("\n--- creating missing lookups ---")
        ensure_lookups(args.api, new_rooms, new_trades)

    created = 0
    for idx, (_, body, cs, _) in enumerate(bodies, 1):
        # `photos` is internal-only; the API ignores it but we strip for clarity.
        post_body = {k: v for k, v in body.items() if k != "photos"}
        try:
            res = post_defect(args.api, post_body)
            for c in cs:
                post_comment(args.api, res["id"], c)
            print(f"[{idx:2}/{len(bodies)}] created {res['id']}: {body['title'][:60]}")
            created += 1
        except Exception as e:
            print(f"[{idx:2}/{len(bodies)}] FAILED: {e}")
    print(f"\nDone. Created {created}/{len(bodies)} defects.")
    return 0 if created == len(bodies) else 2


if __name__ == "__main__":
    raise SystemExit(main())
